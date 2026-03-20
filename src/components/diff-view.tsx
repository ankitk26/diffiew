import type { FileContents } from "@pierre/diffs";
import { MultiFileDiff } from "@pierre/diffs/react";
import { useTheme } from "./theme-provider";
import { Button } from "./ui/button";

interface DiffViewProps {
	oldCode: string;
	newCode: string;
	onBack: () => void;
}

export default function DiffView({ oldCode, newCode, onBack }: DiffViewProps) {
	const { theme } = useTheme();

	const oldFile: FileContents = { name: "", contents: oldCode };
	const newFile: FileContents = { name: "", contents: newCode };

	return (
		<div className="h-svh w-svw p-6">
			<div className="flex h-full flex-col gap-4">
				<Button variant="outline" size="lg" onClick={onBack}>
					Back to editor
				</Button>
				<div className="flex-1 overflow-auto">
					<MultiFileDiff
						oldFile={oldFile}
						newFile={newFile}
						options={{
							diffStyle: "split",
							themeType: theme,
							theme: {
								dark: "vitesse-dark",
								light: "vitesse-light",
							},
							unsafeCSS:
								"[data-no-newline], [data-gutter-buffer='metadata'], [data-change-icon] { display: none !important; } [data-diffs-header] [data-metadata] { order: -1; }",
						}}
					/>
				</div>
			</div>
		</div>
	);
}
