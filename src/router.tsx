import {
	createRouter,
	createRootRoute,
	createRoute,
	Outlet,
} from "@tanstack/react-router";
import { z } from "zod";
import DiffsEditor from "./components/diffs-editor";
import { ThemeProvider } from "./components/theme-provider";

const rootRoute = createRootRoute({
	component: () => (
		<ThemeProvider>
			<Outlet />
		</ThemeProvider>
	),
});

const indexRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/",
	validateSearch: z.object({
		view: z.enum(["edit", "diff"]).optional().catch("edit"),
	}),
	component: DiffsEditor,
});

const routeTree = rootRoute.addChildren([indexRoute]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}
