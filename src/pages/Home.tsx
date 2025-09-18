import { Link } from "react-router-dom";

export default function Home() {
	return (
		<div className="relative flex h-screen items-center justify-center">
			{/* Background image */}
			<div
				className="absolute inset-0 bg-cover bg-center"
				style={{
					backgroundImage: "url('/images/football.jpg')",
					filter: "grayscale(100%)",
				}}
			/>
			{/* Dark overlay */}
			<div className="absolute inset-0 bg-black/50" />

			{/* Foreground content */}
			<div className="relative z-10 text-center bg-white/90 p-8 rounded-xl shadow-lg">
				<h1 className="text-3xl font-bold mb-6">
					Welcome to the Survivor Pool
				</h1>
				<div className="space-y-4">
					<Link
						to="/login"
						className="block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
					>
						Go to Login
					</Link>
					<Link
            to="/signup"
            className="block bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium"
          >
            Sign Up
          </Link>
				</div>
			</div>
		</div>
	);
}
