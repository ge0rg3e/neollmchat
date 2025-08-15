import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '~frontend/components/dialog';
import { InfoIcon, LockIcon, PlusIcon } from 'lucide-react';
import { Tooltip } from '~frontend/components/tooltip';
import { Switch } from '~frontend/components/switch';
import { Button } from '~frontend/components/button';
import { Label } from '~frontend/components/label';
import { Input } from '~frontend/components/input';
import { useApp } from '~frontend/lib/context';
import { modelAttributes } from './models';
import apiClient from '~frontend/lib/api';
import db from '~frontend/lib/dexie';
import { useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';

// Validation schema
const schema = z.object({
	model: z.string().min(1),
	provider: z.string().min(1),
	apiUrl: z.string().url().min(1),
	apiKey: z.string().min(1),
	attributes: z.object({
		imageUpload: z.boolean(),
		imageGeneration: z.boolean(),
		thinkingMode: z.boolean()
	})
});

const AddModel = () => {
	const { session } = useApp();
	const [dialogOpen, setDialogOpen] = useState(false);

	const [createFields, setCreateFields] = useState({
		model: '',
		provider: '',
		apiUrl: '',
		apiKey: '',
		attributes: {
			imageUpload: false,
			imageGeneration: false,
			thinkingMode: false
		}
	});

	const isValid = schema.safeParse(createFields).success;

	const handleSubmit = async () => {
		if (!isValid) {
			return;
		}

		const { data, error } = await apiClient.models.post({
			model: createFields.model,
			provider: createFields.provider,
			apiUrl: createFields.apiUrl,
			apiKey: createFields.apiKey,
			attributes: createFields.attributes
		});

		if (error) {
			toast.error(error?.value.toString());
			return;
		}

		await db.models.put(data);

		setDialogOpen(false);
		toast.success('You have successfully added a new model.');
	};

	if (session?.role !== 'admin') {
		return (
			<Tooltip side="left" content="Admin role required for managing models.">
				<InfoIcon className="size-4 text-muted-foreground" />
			</Tooltip>
		);
	}

	return (
		<Dialog onOpenChange={setDialogOpen} open={dialogOpen}>
			<DialogTrigger>
				<Tooltip side="left" content="Add Model">
					<Button variant="ghost" size="icon">
						<PlusIcon className="size-4" />
					</Button>
				</Tooltip>
			</DialogTrigger>
			<DialogContent className="max-w-[450px] space-y-3 p-5">
				<DialogHeader>
					<DialogTitle>Add Model</DialogTitle>
				</DialogHeader>

				<div className="space-y-3.5 flex-col flex-center-center">
					<div className="w-full space-y-2">
						<Label>Model</Label>
						<Input onChange={(e) => setCreateFields({ ...createFields, model: e.target.value })} placeholder="e.g. gpt-3.5-turbo" value={createFields.model} type="text" required />
					</div>

					<div className="w-full space-y-2">
						<Label>Provider</Label>
						<Input onChange={(e) => setCreateFields({ ...createFields, provider: e.target.value })} placeholder="e.g. OpenAI" value={createFields.provider} type="text" required />
					</div>

					<div className="w-full space-y-2">
						<Label>ApiUrl</Label>
						<Input
							onChange={(e) => setCreateFields({ ...createFields, apiUrl: e.target.value })}
							placeholder="e.g. https://api.openai.com/v1"
							value={createFields.apiUrl}
							type="url"
							required
						/>
					</div>

					<div className="w-full space-y-2">
						<Label>
							ApiKey{' '}
							<Tooltip side="right" content="This API key will be stored encrypted in the database.">
								<LockIcon className="size-3 text-primary" />
							</Tooltip>
						</Label>
						<Input
							onChange={(e) => setCreateFields({ ...createFields, apiKey: e.target.value })}
							placeholder="e.g. sk-∗∗∗∗∗∗∗∗∗∗∗∗∗∗∗∗∗∗∗∗∗∗∗"
							value={createFields.apiKey}
							type="password"
							required
						/>
					</div>

					<div className="w-full space-y-2">
						<Label>
							Attributes <span className="text-xs text-muted-foreground">BETA</span>
						</Label>
						<div className="flex gap-4 items-center">
							{modelAttributes.map((attribute) => (
								<div className="flex items-center space-x-2">
									<Switch
										onCheckedChange={(checked) => setCreateFields({ ...createFields, attributes: { ...createFields.attributes, [attribute.id]: checked } })}
										checked={createFields.attributes[attribute.id as keyof typeof createFields.attributes]}
									/>
									<Label>{attribute.label}</Label>
								</div>
							))}
						</div>
					</div>

					<Button type="submit" className="w-full mt-3" disabled={!isValid} onClick={handleSubmit}>
						Submit
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default AddModel;
