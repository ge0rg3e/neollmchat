import { createBrowserRouter, RouterProvider } from 'react-router';
import AppContextProvider from './lib/context';
import { createRoot } from 'react-dom/client';

// Pages
import Register from './pages/register';
import Login from './pages/login';
import Chat from './pages/chat';
import Home from './pages/home';

// @ts-ignore App Style
import './globals.css';
// @ts-ignore Highlight.js Style
import 'highlight.js/styles/agate.css';

const router = createBrowserRouter([
	{
		path: '/',
		element: <Home />
	},
	{
		path: '/c/:id',
		element: <Chat />
	},
	{
		path: '/login',
		element: <Login />
	},
	{
		path: '/register',
		element: <Register />
	}
]);

const App = () => {
	return (
		<AppContextProvider>
			<RouterProvider router={router} />
		</AppContextProvider>
	);
};

createRoot(document.getElementById('root')!).render(<App />);
