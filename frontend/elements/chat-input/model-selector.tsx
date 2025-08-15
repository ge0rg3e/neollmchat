import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '~frontend/components/dropdown-menu';
import { ModelAttributes } from '../settings/tabs/models';
import { ChevronDownIcon, PlusIcon } from 'lucide-react';
import { Button } from '~frontend/components/button';
import { useLiveQuery } from 'dexie-react-hooks';
import { useApp } from '~frontend/lib/context';
import { useNavigate } from 'react-router';
import db from '~frontend/lib/dexie';

const ModelSelector = () => {
	const navigate = useNavigate();
	const { settings, updateSettings } = useApp();
	const models = useLiveQuery(() => db.models.toArray());

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" className="hover:!bg-primary/10">
					{/* @ts-ignore */}
					{models?.length > 0 ? settings.selectedModel?.model ?? 'No model selected' : 'No models yet'} <ChevronDownIcon />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent>
				{models?.map((model, index) => (
					<DropdownMenuItem key={index} className="flex justify-between items-center" onClick={() => updateSettings('selectedModel', model)}>
						<div className="text-sm">{model.model}</div>
						<ModelAttributes attributes={model.attributes} />
					</DropdownMenuItem>
				))}

				{models?.length === 0 && (
					<DropdownMenuItem onClick={() => navigate('?settings=models')}>
						<PlusIcon /> Add a model
					</DropdownMenuItem>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default ModelSelector;
