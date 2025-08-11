import ChatInput from '~frontend/elements/chat-input';
import Layout from '~frontend/elements/layout';

const Home = () => {
	return (
		<Layout protectedRoute className="size-screen flex-center-center">
			<ChatInput />
		</Layout>
	);
};

export default Home;
