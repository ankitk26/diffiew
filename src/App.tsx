import { ThemeProvider } from "@/components/theme-provider";
import { DiffViewer } from "@/components/diff-viewer";

export function App() {
	return (
		<ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
			<DiffViewer />
		</ThemeProvider>
	);
}

export default App;
