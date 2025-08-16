import { BrainIcon, BrushCleaningIcon, ImageIcon, ImageUpIcon, Trash2Icon } from 'lucide-react';
import { Textarea } from '~frontend/components/textarea';
import { Tooltip } from '~frontend/components/tooltip';
import { Button } from '~frontend/components/button';
import { useLiveQuery } from 'dexie-react-hooks';
import type { Model } from '~frontend/lib/types';
import { useApp } from '~frontend/lib/context';
import apiClient from '~frontend/lib/api';
import db from '~frontend/lib/dexie';
import AddModel from './models.add';
import { toast } from 'sonner';

export const modelAttributes = [
	{
		id: 'imageUpload',
		label: 'Image Upload',
		icon: <ImageUpIcon className="size-4" />
	},
	{
		id: 'imageGeneration',
		label: 'Image Generation',
		icon: <ImageIcon className="size-4" />
	},
	{
		id: 'thinkingMode',
		label: 'Thinking Mode',
		icon: <BrainIcon className="size-4" />
	}
];

const ModelsTab = () => {
	const { session, settings, updateSettings } = useApp();
	const models = useLiveQuery(() => db.models.toArray());

	const handleDeleteModel = async (id: string) => {
		const yes = window.confirm('Are you sure you want to delete this model?');
		if (!yes) return;

		const { error } = await apiClient.models.delete({ id });
		if (error) {
			toast.error(error?.value.toString());
			return;
		}

		await db.models.delete(id);
		updateSettings('selectedModel', null);

		toast.success('You have successfully deleted this model.');
	};

	return (
		<div className="size-full pl-3 space-y-5 animate-in fade-in overflow-y-auto pr-3">
			<div className="space-y-2">
				<div className="flex-between-center">
					<h2 className="font-medium">Models</h2>
					<AddModel />
				</div>

				{models?.map((model, index) => (
					<div key={index} className="w-full h-14 bg-accent/50 flex-between-center gap-x-2 text-sm px-3 border rounded-lg">
						<div className="flex flex-col items-start">
							<div>{model.model}</div>
							<div className="text-muted-foreground flex items-center gap-x-2">
								<div>{model.provider}</div>
								<ModelAttributes attributes={model.attributes} />
							</div>
						</div>

						<div className="flex-end-center gap-x-2">
							{session?.role === 'admin' && (
								<Button variant="ghost" size="icon" onClick={() => handleDeleteModel(model.id)}>
									<Trash2Icon className="size-4" />
								</Button>
							)}
						</div>
					</div>
				))}

				{models?.length === 0 && <p className="text-center text-sm text-muted-foreground">No models yet.</p>}
			</div>

			<div className="space-y-2">
				<div className="flex-between-center">
					<h2 className="font-medium">Custom Instructions</h2>

					<Tooltip side="left" content="Clear">
						<Button variant="ghost" size="icon" disabled={settings.customInstructions === ''} onClick={() => updateSettings('customInstructions', '')}>
							<BrushCleaningIcon className="size-4" />
						</Button>
					</Tooltip>
				</div>

				<Textarea
					onChange={(e) => updateSettings('customInstructions', e.target.value)}
					placeholder="Custom instructions for the model."
					value={settings.customInstructions}
					className="max-h-[300px]"
				/>
			</div>
		</div>
	);
};

export const ModelAttributes = ({ attributes }: { attributes: Model['attributes'] }) => {
	return (
		<div className="flex items-center gap-x-2">
			{attributes.imageGeneration && (
				<Tooltip content="Image Generation">
					<div>
						<ImageIcon className="size-4 text-blue-500" />
					</div>
				</Tooltip>
			)}
			{attributes.imageUpload && (
				<Tooltip content="Image Upload">
					<div>
						<ImageUpIcon className="size-4 text-blue-600" />
					</div>
				</Tooltip>
			)}
			{attributes.thinkingMode && (
				<Tooltip content="Thinking Mode">
					<div>
						<BrainIcon className="size-4 text-orange-500" />
					</div>
				</Tooltip>
			)}
		</div>
	);
};

export default ModelsTab;
