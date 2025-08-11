import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '~frontend/components/command';
import { useLiveQuery } from 'dexie-react-hooks';
import { useApp } from '~frontend/lib/context';
import { useNavigate } from 'react-router';
import db from '~frontend/lib/dexie';
import { useState } from 'react';

const Search = () => {
	const navigate = useNavigate();
	const { showSearch, setShowSearch } = useApp();
	const [searchQuery, setSearchQuery] = useState('');
	const chats = useLiveQuery(() => db.chats.toArray());

	const onSelect = (id: string) => {
		navigate(`/c/${id}`);
		handleClose();
	};

	const handleClose = () => {
		setShowSearch(false);
		setSearchQuery('');
	};

	const filteredChats = searchQuery ? chats?.filter((chat) => chat.title.toLowerCase().includes(searchQuery.toLowerCase())) : chats;

	return (
		<CommandDialog open={showSearch} onOpenChange={(state) => state === false && handleClose()}>
			<CommandInput placeholder="Search chats..." value={searchQuery} onValueChange={(e) => setSearchQuery(e)} />
			<CommandList>
				<CommandEmpty>{chats?.length === 0 ? 'No chats yet.' : 'No results found.'}</CommandEmpty>
				<CommandGroup>
					{filteredChats?.map((chat, index) => (
						<CommandItem key={index} value={chat.title} className="cursor-pointer" onSelect={() => onSelect(chat.id)}>
							{chat.title}
						</CommandItem>
					))}
				</CommandGroup>
			</CommandList>
		</CommandDialog>
	);
};

export default Search;
