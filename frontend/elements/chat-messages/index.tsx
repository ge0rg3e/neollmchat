import { useLiveQuery } from 'dexie-react-hooks';
import { useParams } from 'react-router';
import db from '~frontend/lib/dexie';
import Message from './message';

const ChatMessages = () => {
	const params = useParams();
	const chats = useLiveQuery(() => db.chats.toArray());
	const chat = chats?.find((chat) => chat.id === params.id);

	return (
		<div className="size-full max-h-[94vh] px-3 pt-5 pb-[160px] space-y-8 overflow-y-auto overflow-x-hidden outline-none" id="chat-messages">
			{chat ? (
				chat.messages.map((data, index) => <Message key={index} data={data} />)
			) : (
				<div className="size-full flex-center-center">
					<p className="font-medium text-lg text-muted-foreground">Chat not found.</p>
				</div>
			)}
		</div>
	);
};

export default ChatMessages;
