import { CheckIcon, LoaderCircleIcon, MicIcon, XIcon } from 'lucide-react';
import { useState, useRef, useEffect, Fragment } from 'react';
import { Button } from '~frontend/components/button';
import { useApp } from '~frontend/lib/context';
import apiClient from '~frontend/lib/api';
import { toast } from 'sonner';

export const TranscribeTrigger = () => {
	const { setChatInput, settings } = useApp();

	const [isProcessing, setIsProcessing] = useState<boolean>(false);
	const [audioChunks, setAudioChunks] = useState<BlobPart[]>([]);
	const [isListening, setIsListening] = useState<boolean>(false);
	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const audioContextRef = useRef<AudioContext | null>(null);
	const analyserRef = useRef<AnalyserNode | null>(null);
	const dataArrayRef = useRef<Uint8Array | null>(null);

	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const animationRef = useRef<number | null>(null);

	const drawScrollingWave = () => {
		if (!analyserRef.current || !dataArrayRef.current || !canvasRef.current) return;

		const analyser = analyserRef.current;
		const dataArray = dataArrayRef.current;
		analyser.getByteTimeDomainData(dataArray);

		// Compute average volume
		let sum = 0;
		for (let i = 0; i < dataArray.length; i++) {
			sum += Math.abs(dataArray[i] - 128);
		}
		const avg = sum / dataArray.length;
		const normalized = avg / 128; // 0 to 1

		const canvas = canvasRef.current;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		// Shift canvas left by 1px
		const imageData = ctx.getImageData(1, 0, canvas.width - 1, canvas.height);
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.putImageData(imageData, 0, 0);

		// Draw new bar on the right
		const scale = 2.5; // bigger waves
		let barHeight = normalized * canvas.height * scale;
		if (barHeight > canvas.height) barHeight = canvas.height;

		const y = (canvas.height - barHeight) / 2;
		ctx.fillStyle = '#a995c9';
		ctx.fillRect(canvas.width - 1, y, 1, barHeight);

		animationRef.current = requestAnimationFrame(drawScrollingWave);
	};

	const clearCanvas = () => {
		if (!canvasRef.current) return;
		const ctx = canvasRef.current.getContext('2d');
		if (!ctx) return;
		ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
	};

	const startTranscribing = async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
			mediaRecorderRef.current = mediaRecorder;
			setAudioChunks([]);

			mediaRecorder.ondataavailable = (e) => {
				if (e.data.size > 0) setAudioChunks((chunks) => [...chunks, e.data]);
			};

			mediaRecorder.start(250);

			const audioContext = new AudioContext();
			audioContextRef.current = audioContext;
			const source = audioContext.createMediaStreamSource(stream);
			const analyser = audioContext.createAnalyser();
			analyser.fftSize = 256;
			analyserRef.current = analyser;
			source.connect(analyser);

			dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);

			setIsListening(true);

			if (animationRef.current) cancelAnimationFrame(animationRef.current);
			animationRef.current = requestAnimationFrame(drawScrollingWave);
		} catch {
			toast.error('Microphone permission denied');
		}
	};

	const stopAndCleanup = () => {
		if (animationRef.current) {
			cancelAnimationFrame(animationRef.current);
			animationRef.current = null;
		}
		if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
			mediaRecorderRef.current.stop();
			mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
		}
		audioContextRef.current?.close();
		audioContextRef.current = null;
		analyserRef.current = null;
		setIsListening(false);
	};

	const cancelTranscribing = () => {
		stopAndCleanup();
		clearCanvas();
		setAudioChunks([]);
	};

	const processTranscribing = async () => {
		if (!mediaRecorderRef.current) return;
		setIsProcessing(true);

		mediaRecorderRef.current.onstop = async () => {
			stopAndCleanup();
			clearCanvas();

			if (audioChunks.length === 0) {
				toast.error('No audio recorded');
				return;
			}

			const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
			const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });

			try {
				const { data } = await apiClient.transcribe.post({ recording: audioFile, language: settings.transcribeLanguage });

				if (data?.result) {
					setChatInput((prev) => ({ ...prev, text: prev.text + data.result }));
				} else {
					toast.error('Failed to transcribe audio');
				}
			} catch {
				toast.error('Failed to transcribe audio');
			}

			setAudioChunks([]);
			setIsProcessing(false);
		};

		if (mediaRecorderRef.current.state !== 'inactive') {
			mediaRecorderRef.current.stop();
			mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
		}
	};

	useEffect(() => {
		return () => {
			stopAndCleanup();
		};
	}, []);

	return (
		<Fragment>
			<canvas
				ref={canvasRef}
				width={200}
				height={30}
				style={{
					display: isListening ? 'block' : 'none',
					marginRight: 8
				}}
			/>

			{!isListening && (
				<Button variant="ghost" size="icon" title="Transcribe" className="hover:!bg-primary/10" disabled={isProcessing} onClick={startTranscribing}>
					{isProcessing ? <LoaderCircleIcon className="animate-spin" /> : <MicIcon />}
				</Button>
			)}

			{isListening && (
				<Fragment>
					<Button variant="ghost" size="icon" title="Cancel" className="hover:!bg-primary/10" onClick={cancelTranscribing}>
						<XIcon />
					</Button>

					<Button variant="ghost" size="icon" title="Process" className="hover:!bg-primary/10" onClick={processTranscribing}>
						<CheckIcon />
					</Button>
				</Fragment>
			)}
		</Fragment>
	);
};

export const transcribeLanguages = [
	{ id: 'af', label: 'Afrikaans' },
	{ id: 'am', label: 'Amharic' },
	{ id: 'ar', label: 'Arabic' },
	{ id: 'as', label: 'Assamese' },
	{ id: 'az', label: 'Azerbaijani' },
	{ id: 'ba', label: 'Bashkir' },
	{ id: 'be', label: 'Belarusian' },
	{ id: 'bg', label: 'Bulgarian' },
	{ id: 'bn', label: 'Bengali' },
	{ id: 'bo', label: 'Tibetan' },
	{ id: 'br', label: 'Breton' },
	{ id: 'bs', label: 'Bosnian' },
	{ id: 'ca', label: 'Catalan' },
	{ id: 'cs', label: 'Czech' },
	{ id: 'cy', label: 'Welsh' },
	{ id: 'da', label: 'Danish' },
	{ id: 'de', label: 'German' },
	{ id: 'el', label: 'Greek' },
	{ id: 'en', label: 'English' },
	{ id: 'es', label: 'Spanish' },
	{ id: 'et', label: 'Estonian' },
	{ id: 'eu', label: 'Basque' },
	{ id: 'fa', label: 'Persian' },
	{ id: 'fi', label: 'Finnish' },
	{ id: 'fo', label: 'Faroese' },
	{ id: 'fr', label: 'French' },
	{ id: 'gl', label: 'Galician' },
	{ id: 'gu', label: 'Gujarati' },
	{ id: 'ha', label: 'Hausa' },
	{ id: 'haw', label: 'Hawaiian' },
	{ id: 'he', label: 'Hebrew' },
	{ id: 'hi', label: 'Hindi' },
	{ id: 'hr', label: 'Croatian' },
	{ id: 'ht', label: 'Haitian Creole' },
	{ id: 'hu', label: 'Hungarian' },
	{ id: 'hy', label: 'Armenian' },
	{ id: 'id', label: 'Indonesian' },
	{ id: 'is', label: 'Icelandic' },
	{ id: 'it', label: 'Italian' },
	{ id: 'ja', label: 'Japanese' },
	{ id: 'jw', label: 'Javanese' },
	{ id: 'ka', label: 'Georgian' },
	{ id: 'kk', label: 'Kazakh' },
	{ id: 'km', label: 'Khmer' },
	{ id: 'kn', label: 'Kannada' },
	{ id: 'ko', label: 'Korean' },
	{ id: 'la', label: 'Latin' },
	{ id: 'lb', label: 'Luxembourgish' },
	{ id: 'ln', label: 'Lingala' },
	{ id: 'lo', label: 'Lao' },
	{ id: 'lt', label: 'Lithuanian' },
	{ id: 'lv', label: 'Latvian' },
	{ id: 'mg', label: 'Malagasy' },
	{ id: 'mi', label: 'Maori' },
	{ id: 'mk', label: 'Macedonian' },
	{ id: 'ml', label: 'Malayalam' },
	{ id: 'mn', label: 'Mongolian' },
	{ id: 'mr', label: 'Marathi' },
	{ id: 'ms', label: 'Malay' },
	{ id: 'mt', label: 'Maltese' },
	{ id: 'my', label: 'Myanmar' },
	{ id: 'ne', label: 'Nepali' },
	{ id: 'nl', label: 'Dutch' },
	{ id: 'nn', label: 'Nynorsk' },
	{ id: 'no', label: 'Norwegian' },
	{ id: 'oc', label: 'Occitan' },
	{ id: 'pa', label: 'Panjabi' },
	{ id: 'pl', label: 'Polish' },
	{ id: 'ps', label: 'Pashto' },
	{ id: 'pt', label: 'Portuguese' },
	{ id: 'ro', label: 'Romanian' },
	{ id: 'ru', label: 'Russian' },
	{ id: 'sa', label: 'Sanskrit' },
	{ id: 'sd', label: 'Sindhi' },
	{ id: 'si', label: 'Sinhala' },
	{ id: 'sk', label: 'Slovak' },
	{ id: 'sl', label: 'Slovenian' },
	{ id: 'sn', label: 'Shona' },
	{ id: 'so', label: 'Somali' },
	{ id: 'sq', label: 'Albanian' },
	{ id: 'sr', label: 'Serbian' },
	{ id: 'su', label: 'Sundanese' },
	{ id: 'sv', label: 'Swedish' },
	{ id: 'sw', label: 'Swahili' },
	{ id: 'ta', label: 'Tamil' },
	{ id: 'te', label: 'Telugu' },
	{ id: 'tg', label: 'Tajik' },
	{ id: 'th', label: 'Thai' },
	{ id: 'tk', label: 'Turkmen' },
	{ id: 'tl', label: 'Tagalog' },
	{ id: 'tr', label: 'Turkish' },
	{ id: 'tt', label: 'Tatar' },
	{ id: 'uk', label: 'Ukrainian' },
	{ id: 'ur', label: 'Urdu' },
	{ id: 'uz', label: 'Uzbek' },
	{ id: 'vi', label: 'Vietnamese' },
	{ id: 'yi', label: 'Yiddish' },
	{ id: 'yo', label: 'Yoruba' },
	{ id: 'yue', label: 'Cantonese' },
	{ id: 'zh', label: 'Chinese' }
];
