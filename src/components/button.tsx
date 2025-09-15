export function Button({
	children,
	...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
	return (
		<button type="button" {...props}>
			{children}
		</button>
	);
}
