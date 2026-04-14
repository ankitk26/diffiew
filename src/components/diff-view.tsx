import type { FileContents } from "@pierre/diffs";
import { MultiFileDiff } from "@pierre/diffs/react";
import { useTheme } from "./theme-provider";

export default function DiffView({
	oldCode,
	newCode,
}: {
	oldCode: string;
	newCode: string;
}) {
	const { theme } = useTheme();

	const oldFile: FileContents = { name: "", contents: oldCode };
	const newFile: FileContents = { name: "", contents: newCode };

	if (oldCode === newCode) {
		return (
			<div className="flex flex-1 items-center justify-center text-muted-foreground">
				The two texts are identical
			</div>
		);
	}

	return (
		<div className="flex-1 overflow-auto">
			<MultiFileDiff
				oldFile={oldFile}
				newFile={newFile}
				options={{
					diffStyle: "split",
					themeType: theme,
					theme: { dark: "vitesse-dark", light: "vitesse-light" },
					unsafeCSS:
						"[data-no-newline], [data-gutter-buffer='metadata'], [data-change-icon] { display: none !important; } [data-diffs-header] [data-metadata] { order: -1; }",
				}}
			/>
		</div>
	);
}
