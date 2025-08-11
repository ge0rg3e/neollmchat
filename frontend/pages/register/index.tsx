import { Button } from '~frontend/components/button';
import { Input } from '~frontend/components/input';
import { Label } from '~frontend/components/label';
import { Link, useNavigate } from 'react-router';
import Layout from '~frontend/elements/layout';
import apiClient from '~frontend/lib/api';
import { toast } from 'sonner';

const Register = () => {
	const navigate = useNavigate();

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		const form = e.currentTarget as HTMLFormElement;
		const username = form.username.value;
		const email = form.email.value;
		const password = form.password.value;

		const { error } = await apiClient.auth.register.post({ username, email, password });
		if (error) return toast.error(error?.value.toString());

		toast.success('You have successfully registered.');
		navigate('/login');
	};

	return (
		<Layout className="size-screen flex-center-center">
			<div className="size-full grid grid-cols-1 lg:grid-cols-2">
				{/* Left */}
				<div className="size-full flex-col flex-center-center">
					<div className="w-full max-w-[385px]">
						<p className="text-muted-foreground text-center font-semibold text-2xl mb-6">Register to NeoLLMChat.</p>

						<form className="w-full space-y-3.5 flex-col flex-center-center" onSubmit={handleSubmit}>
							<div className="w-full space-y-2">
								<Label htmlFor="username">Username</Label>
								<Input type="text" name="username" id="username" placeholder="your-username" required />
							</div>

							<div className="w-full space-y-2">
								<Label htmlFor="email">Email</Label>
								<Input type="email" name="email" id="email" placeholder="your@email.com" required />
							</div>

							<div className="w-full space-y-2">
								<Label htmlFor="password">Password</Label>
								<Input type="password" name="password" id="password" placeholder="∗∗∗∗∗∗∗∗∗∗∗∗∗∗∗∗∗" required />
							</div>

							<Button className="mt-3 w-full" type="submit">
								Register
							</Button>

							<p className="text-center text-sm text-muted-foreground">
								Already have an account?{' '}
								<Link to="/login" className="underline text-primary">
									Log in
								</Link>
							</p>
						</form>
					</div>
				</div>

				{/* Right */}
				<div className="size-full hidden lg:flex flex-col flex-center-center bg-muted bg-cover bg-center bg-no-repeat bg-[url('/images/auth-bg.png')]"></div>
			</div>
		</Layout>
	);
};

export default Register;
