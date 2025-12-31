import { Button } from "@/components/ui/button";
import {
	computeDiff,
	enhanceWithCharDiffs,
	type CharDiff,
	type DiffLine,
} from "@/lib/diff";
import { cn } from "@/lib/utils";
import {
	IconArrowsLeftRight,
	IconCopy,
	IconFileUpload,
	IconMinus,
	IconPencil,
	IconPlus,
	IconEye,
} from "@tabler/icons-react";
import { useMemo, useRef, useState } from "react";

interface DiffEditorProps {
	left: string;
	right: string;
	leftTitle?: string;
	rightTitle?: string;
	onLeftChange?: (value: string) => void;
	onRightChange?: (value: string) => void;
	leftFileInputRef?: React.RefObject<HTMLInputElement>;
	rightFileInputRef?: React.RefObject<HTMLInputElement>;
	onLeftFileClick?: () => void;
	onRightFileClick?: () => void;
	onLeftFileLoad?: (file: File) => void;
	onRightFileLoad?: (file: File) => void;
}

export function DiffEditor({
	left,
	right,
	leftTitle = "Original",
	rightTitle = "Modified",
	onLeftChange,
	onRightChange,
	leftFileInputRef,
	rightFileInputRef,
	onLeftFileClick,
	onRightFileClick,
	onLeftFileLoad,
	onRightFileLoad,
}: DiffEditorProps) {
	const diffLines = useMemo(() => {
		const diff = computeDiff(left, right);
		return enhanceWithCharDiffs(diff);
	}, [left, right]);

	const [editingSide, setEditingSide] = useState<"both" | null>("both");
	const leftTextareaRef = useRef<HTMLTextAreaElement>(null);
	const rightTextareaRef = useRef<HTMLTextAreaElement>(null);
	const isEditing = editingSide === "both";

	const diffStats = {
		added: diffLines.filter((l) => l.type === "insert").length,
		removed: diffLines.filter((l) => l.type === "delete").length,
		modified: diffLines.filter((l) => l.type === "modify").length,
	};

	const handleCopyLeft = () => {
		navigator.clipboard.writeText(left);
	};

	const handleCopyRight = () => {
		navigator.clipboard.writeText(right);
	};

	const handleSwap = () => {
		const temp = left;
		onLeftChange?.(right);
		onRightChange?.(temp);
	};

	const toggleMode = () => {
		setEditingSide(editingSide === null ? "both" : null);
	};

	const renderCharDiff = (charDiffs: CharDiff[], isLeft: boolean) => {
		return charDiffs.map((charDiff, idx) => {
			const className =
				charDiff.type === "delete" && isLeft
					? "bg-rose-500/40 dark:bg-rose-400/30 rounded-sm"
					: charDiff.type === "insert" && !isLeft
						? "bg-emerald-500/40 dark:bg-emerald-400/30 rounded-sm"
						: "";
			return (
				<span key={idx} className={cn(className, "whitespace-pre")}>
					{charDiff.text}
				</span>
			);
		});
	};

	const renderDiffRow = (line: DiffLine, index: number) => {
		const hasLeft = line.leftLine !== undefined;
		const hasRight = line.rightLine !== undefined;

		// Background colors for cells
		const leftBgColor =
			line.type === "delete"
				? "bg-rose-500/10 dark:bg-rose-500/20"
				: line.type === "modify"
					? "bg-rose-500/10 dark:bg-rose-500/20"
					: "";

		const rightBgColor =
			line.type === "insert"
				? "bg-emerald-500/10 dark:bg-emerald-500/20"
				: line.type === "modify"
					? "bg-emerald-500/10 dark:bg-emerald-500/20"
					: "";

		// Blank placeholder background (when line doesn't exist on that side)
		const leftPlaceholderBg = !hasLeft
			? "bg-muted/50 dark:bg-muted/30"
			: "";
		const rightPlaceholderBg = !hasRight
			? "bg-muted/50 dark:bg-muted/30"
			: "";

		// Gutter colors
		const leftGutterColor =
			line.type === "delete" || (line.type === "modify" && hasLeft)
				? "text-rose-600/70 dark:text-rose-400/70"
				: "text-muted-foreground/50";

		const rightGutterColor =
			line.type === "insert" || (line.type === "modify" && hasRight)
				? "text-emerald-600/70 dark:text-emerald-400/70"
				: "text-muted-foreground/50";

		return (
			<div key={index} className="flex min-h-5 items-start">
				{/* Left Cell */}
				<div
					className={cn(
						"flex-1 basis-0 min-w-0 flex items-start",
						leftBgColor,
						leftPlaceholderBg,
					)}
				>
					{/* Left Gutter */}
					<div
						className={cn(
							"shrink-0 w-10 px-2 text-right text-[10px] select-none leading-code tabular-nums flex items-center justify-end",
							leftGutterColor,
						)}
						style={{ minHeight: "1.25rem" }}
					>
						{hasLeft ? line.leftLineNumber : ""}
					</div>
					{/* Left Content */}
					<div className="flex-1 min-w-0 pr-3 text-code leading-code overflow-x-auto scrollbar-none flex items-center">
						<span className="whitespace-pre">
							{hasLeft ? (
								line.leftCharDiffs ? (
									renderCharDiff(line.leftCharDiffs, true)
								) : (
									line.leftLine
								)
							) : (
								<span className="text-transparent">&nbsp;</span>
							)}
						</span>
					</div>
				</div>

				{/* Divider */}
				<div className="w-px bg-border/50 shrink-0" />

				{/* Right Cell */}
				<div
					className={cn(
						"flex-1 basis-0 min-w-0 flex items-start",
						rightBgColor,
						rightPlaceholderBg,
					)}
				>
					{/* Right Gutter */}
					<div
						className={cn(
							"shrink-0 w-10 px-2 text-right text-[10px] select-none leading-code tabular-nums flex items-center justify-end",
							rightGutterColor,
						)}
						style={{ minHeight: "1.25rem" }}
					>
						{hasRight ? line.rightLineNumber : ""}
					</div>
					{/* Right Content */}
					<div className="flex-1 min-w-0 pr-3 text-code leading-code overflow-x-auto scrollbar-none flex items-center">
						<span className="whitespace-pre">
							{hasRight ? (
								line.rightCharDiffs ? (
									renderCharDiff(line.rightCharDiffs, false)
								) : (
									line.rightLine
								)
							) : (
								<span className="text-transparent">&nbsp;</span>
							)}
						</span>
					</div>
				</div>
			</div>
		);
	};

	return (
		<div className="flex flex-col h-full bg-background">
			{/* Toolbar */}
			<div className="shrink-0 flex items-stretch border-b border-border/50 bg-muted/30">
				{/* Left Panel Header */}
				<div className="flex-1 flex items-center gap-3 px-4 py-2">
					<span className="text-code font-medium text-foreground/80">
						{leftTitle}
					</span>

					{leftFileInputRef && onLeftFileClick && (
						<>
							<input
								ref={leftFileInputRef}
								type="file"
								accept=".txt,.js,.ts,.jsx,.tsx,.json,.md,.css,.html"
								onChange={(e) => {
									const file = e.target.files?.[0];
									if (file && onLeftFileLoad)
										onLeftFileLoad(file);
								}}
								className="hidden"
							/>
							<Button
								variant="ghost"
								size="icon-xs"
								onClick={onLeftFileClick}
								title="Load file"
								className="text-muted-foreground hover:text-foreground"
							>
								<IconFileUpload className="size-3" />
							</Button>
						</>
					)}

					<div className="flex-1" />

					{!isEditing && diffStats.removed > 0 && (
						<div className="flex items-center gap-1.5 text-code text-rose-600 dark:text-rose-400">
							<IconMinus className="size-3" />
							<span>{diffStats.removed}</span>
						</div>
					)}

					<Button
						variant="ghost"
						size="icon-xs"
						onClick={handleCopyLeft}
						title="Copy"
						className="text-muted-foreground hover:text-foreground"
					>
						<IconCopy className="size-3" />
					</Button>
				</div>

				{/* Center Controls */}
				<div className="flex items-stretch border-x border-border/50">
					<Button
						variant={isEditing ? "default" : "ghost"}
						onClick={toggleMode}
						title={
							isEditing
								? "Switch to viewing"
								: "Switch to editing"
						}
						className={cn(
							"h-full px-3 rounded-none gap-1.5 text-[10px] font-medium",
							isEditing &&
								"bg-primary/10 text-primary hover:bg-primary/20",
						)}
					>
						{isEditing ? (
							<>
								<IconPencil className="size-3" />
								<span>Editing</span>
							</>
						) : (
							<>
								<IconEye className="size-3" />
								<span>Viewing</span>
							</>
						)}
					</Button>
					<Button
						variant="ghost"
						onClick={handleSwap}
						title="Swap"
						className="h-full px-3 rounded-none text-muted-foreground hover:text-foreground"
					>
						<IconArrowsLeftRight className="size-3" />
					</Button>
				</div>

				{/* Right Panel Header */}
				<div className="flex-1 flex items-center gap-3 px-4 py-2">
					<span className="text-code font-medium text-foreground/80">
						{rightTitle}
					</span>

					{rightFileInputRef && onRightFileClick && (
						<>
							<input
								ref={rightFileInputRef}
								type="file"
								accept=".txt,.js,.ts,.jsx,.tsx,.json,.md,.css,.html"
								onChange={(e) => {
									const file = e.target.files?.[0];
									if (file && onRightFileLoad)
										onRightFileLoad(file);
								}}
								className="hidden"
							/>
							<Button
								variant="ghost"
								size="icon-xs"
								onClick={onRightFileClick}
								title="Load file"
								className="text-muted-foreground hover:text-foreground"
							>
								<IconFileUpload className="size-3" />
							</Button>
						</>
					)}

					<div className="flex-1" />

					{!isEditing && diffStats.added > 0 && (
						<div className="flex items-center gap-1.5 text-code text-emerald-600 dark:text-emerald-400">
							<IconPlus className="size-3" />
							<span>{diffStats.added}</span>
						</div>
					)}

					<Button
						variant="ghost"
						size="icon-xs"
						onClick={handleCopyRight}
						title="Copy"
						className="text-muted-foreground hover:text-foreground"
					>
						<IconCopy className="size-3" />
					</Button>
				</div>
			</div>

			{/* Diff View - Single scroll container */}
			{!isEditing ? (
				<div className="flex-1 overflow-y-auto">
					<div className="min-w-full">
						{diffLines.map((line, index) =>
							renderDiffRow(line, index),
						)}
					</div>
				</div>
			) : (
				/* Edit Mode */
				<div className="flex flex-1 overflow-hidden">
					{/* Left Editor */}
					<div className="flex-1 basis-0 min-w-0 flex flex-col overflow-hidden">
						<textarea
							ref={leftTextareaRef}
							value={left}
							onChange={(e) => onLeftChange?.(e.target.value)}
							className="flex-1 w-full px-3 py-2 text-code leading-code whitespace-pre overflow-auto bg-background text-foreground caret-primary resize-none outline-none border-0"
							spellCheck={false}
						/>
					</div>

					{/* Divider */}
					<div className="w-px bg-border/50 shrink-0" />

					{/* Right Editor */}
					<div className="flex-1 basis-0 min-w-0 flex flex-col overflow-hidden">
						<textarea
							ref={rightTextareaRef}
							value={right}
							onChange={(e) => onRightChange?.(e.target.value)}
							className="flex-1 w-full px-3 py-2 text-code leading-code whitespace-pre overflow-auto bg-background text-foreground caret-primary resize-none outline-none border-0"
							spellCheck={false}
						/>
					</div>
				</div>
			)}
		</div>
	);
}
