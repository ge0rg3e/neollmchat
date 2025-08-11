import ExportChat from '~frontend/elements/chat-messages/export';
import ChatMessages from '~frontend/elements/chat-messages';
import ChatInput from '~frontend/elements/chat-input';
import Layout from '~frontend/elements/layout';
import { useParams } from 'react-router';

const Chat = () => {
	const params = useParams();

	return (
		<Layout protectedRoute className="relative size-screen flex-between-center flex-col">
			<ExportChat chatId={params.id!} />
			<ChatMessages />
			<ChatInput />
		</Layout>
	);
};

export default Chat;
