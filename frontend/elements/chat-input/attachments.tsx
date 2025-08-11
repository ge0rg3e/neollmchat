import type { Attachment } from '~frontend/lib/types';
import { Button } from '~frontend/components/button';
import { LinkIcon, XIcon } from 'lucide-react';
import { useApp } from '~frontend/lib/context';
import { Fragment, useRef } from 'react';
import { toast } from 'sonner';

export const AttachmentsTrigger = () => {
	const { chatInput, setChatInput } = useApp();
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.files && event.target.files[0]) {
			const file = event.target.files[0];

			const attachment: Attachment = {
				fileName: file.name,
				mimeType: file.type,
				data: await new Promise((resolve) => {
					const reader = new FileReader();
					reader.onloadend = () => {
						const base64String = reader.result as string;
						const base64Data = base64String.split(',')[1];
						resolve(base64Data);
					};
					reader.readAsDataURL(file);
				})
			};

			if (chatInput.attachments.find((a) => a.fileName === attachment.fileName || a.data === attachment.data)) {
				return toast.error('File already attached.');
			}

			setChatInput((prev) => ({ ...prev, attachments: [...prev.attachments, attachment] }));

			// Reset the input element
			event.target.value = '';
		}
	};

	return (
		<Fragment>
			<Button variant="ghost" size="icon" title="Attach a file" className="hover:!bg-primary/10" onClick={() => fileInputRef.current?.click()}>
				<LinkIcon />
			</Button>

			<input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} accept=".png,.jpg,.jpeg" />
		</Fragment>
	);
};

export const AttachmentsPreview = () => {
	const { chatInput, setChatInput } = useApp();

	const handleRemove = (index: number) => {
		const newAttachments = [...chatInput.attachments];
		newAttachments.splice(index, 1);
		setChatInput((prev) => ({ ...prev, attachments: newAttachments }));
	};

	if (chatInput.attachments.length === 0) return null;

	return (
		<div className="flex-start-center gap-x-2 pt-3 px-2">
			{chatInput.attachments.map((attachment, index) => {
				const isImage = attachment.mimeType.startsWith('image/');

				return (
					<div key={index} className="flex-center-center relative overflow-hidden group">
						<button
							className="absolute opacity-0 group-hover:opacity-100 size-full flex-center-center transition-smooth bg-background/50 cursor-pointer backdrop-blur-[2px] text-destructive"
							onClick={() => handleRemove(index)}
							title={`Remove ${attachment.fileName}`}
						>
							<XIcon className="size-4" />
						</button>

						{isImage && <img src={`data:${attachment.mimeType};base64,${attachment.data}`} alt={attachment.fileName} className="size-11 rounded-lg object-cover border" />}
					</div>
				);
			})}
		</div>
	);
};
