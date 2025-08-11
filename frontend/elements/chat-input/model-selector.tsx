import { Popover, PopoverContent, PopoverTrigger } from '~frontend/components/popover';
import { Button } from '~frontend/components/button';
import { truncateString } from '~frontend/lib/utils';
import { useLiveQuery } from 'dexie-react-hooks';
import { ChevronDownIcon } from 'lucide-react';
import { useApp } from '~frontend/lib/context';
import db from '~frontend/lib/dexie';
import { useState } from 'react';

const ModelSelector = () => {
	const [open, setOpen] = useState(false);
	const { selectedModel, changeModel } = useApp();
	const models = useLiveQuery(() => db.models.toArray());

	return (
		<Popover onOpenChange={setOpen} open={open}>
			<PopoverTrigger asChild>
				<Button variant="ghost" className="hover:!bg-primary/10">
					{/* @ts-ignore */}
					{models?.length > 0 ? selectedModel.model ?? 'No model selected' : 'No models yet'} <ChevronDownIcon />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="!w-full !min-w-[250px] !max-w-[250px] p-1">
				{models?.map((model, index) => (
					<div
						key={index}
						className="w-full h-8 px-3 flex-between-center cursor-pointer rounded-sm hover:bg-primary/10"
						onClick={() => {
							changeModel(model);
							setOpen(false);
						}}
					>
						<div className="text-sm" title={model.model}>
							{truncateString(model.model, 26)}
						</div>
					</div>
				))}
			</PopoverContent>
		</Popover>
	);
};

export default ModelSelector;
