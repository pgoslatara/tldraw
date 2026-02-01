import {
	StateNode,
	TLKeyboardEventInfo,
	TLPointerEventInfo,
	TLStateNodeConstructor,
} from '@tldraw/editor'
import { Idle } from './childStates/Idle'
import { Pointing } from './childStates/Pointing'
import { ZoomBrushing } from './childStates/ZoomBrushing'
import { ZoomQuick } from './childStates/ZoomQuick'

/** @public */
export class ZoomTool extends StateNode {
	static override id = 'zoom'
	static override initial = 'idle'
	static override children(): TLStateNodeConstructor[] {
		return [Idle, Pointing, ZoomBrushing, ZoomQuick]
	}
	static override isLockable = false

	info = {} as TLPointerEventInfo & { onInteractionEnd?: string }

	override onEnter(info: TLPointerEventInfo & { onInteractionEnd: string }) {
		this.info = info
		this.parent.setCurrentToolIdMask(info.onInteractionEnd)
		this.updateCursor()
	}

	override onExit() {
		this.parent.setCurrentToolIdMask(undefined)
		this.editor.updateInstanceState({ zoomBrush: null, cursor: { type: 'default', rotation: 0 } })
	}

	override onKeyDown() {
		this.updateCursor()
	}

	override onKeyUp(info: TLKeyboardEventInfo) {
		this.updateCursor()

		if (info.key === 'z') {
			this.complete()
		}
	}

	override onInterrupt() {
		this.complete()
	}

	private complete() {
		// onInteractionEnd is a path like 'select.idle', extract just the tool ID
		const toolId = this.info.onInteractionEnd?.split('.')[0] ?? 'select'
		this.editor.setCurrentTool(toolId)
	}

	private updateCursor() {
		if (this.editor.inputs.getAltKey()) {
			this.editor.setCursor({ type: 'zoom-out', rotation: 0 })
		} else {
			this.editor.setCursor({ type: 'zoom-in', rotation: 0 })
		}
	}
}
