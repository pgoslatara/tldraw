import { Box, StateNode, TLKeyboardEventInfo, TLPointerEventInfo } from '@tldraw/editor'

export class ZoomQuick extends StateNode {
	static override id = 'zoom_quick'

	info = {} as TLPointerEventInfo & { onInteractionEnd?: string }

	didZoom = false
	zoomBrush = null as Box | null
	initialViewport = new Box()

	override onEnter(info: TLPointerEventInfo & { onInteractionEnd: string }) {
		const { editor } = this
		this.info = info
		this.zoomBrush = null
		this.didZoom = false
		this.initialViewport = editor.getViewportPageBounds()

		// Zoom out to 5%, keeping the cursor over the same page point
		const { x: cx, y: cy, z: cz } = editor.getCamera()
		const point = editor.inputs.getCurrentScreenPoint()
		const newZoom = 0.05
		editor.setCamera({
			x: cx + (point.x / newZoom - point.x) - (point.x / cz - point.x),
			y: cy + (point.y / newZoom - point.y) - (point.y / cz - point.y),
			z: newZoom,
		})

		// Show the viewport brush immediately
		this.updateBrush()
	}

	override onExit() {
		this.zoomToNewViewport()
		this.editor.updateInstanceState({ zoomBrush: null })
	}

	override onPointerMove() {
		this.updateBrush()
	}

	override onPointerUp() {
		this.updateBrush()
		this.zoomToNewViewport()
	}

	override onCancel() {
		// Clear brush so onExit zooms back to initial viewport
		this.zoomBrush = null
		this.editor.updateInstanceState({ zoomBrush: null })
		// Exit the zoom tool entirely
		this.editor.setCurrentTool('select')
	}

	override onKeyUp(info: TLKeyboardEventInfo) {
		if (info.key === 'Shift') {
			this.parent.transition('idle', this.info)
		}
	}

	private updateBrush() {
		if (this.didZoom) return
		const { editor } = this

		const screenBounds = editor.getViewportScreenBounds()

		const maxScreenFactor = 4
		const brushWidth = Math.min(
			screenBounds.w / editor.getZoomLevel() / maxScreenFactor / 2,
			this.initialViewport.w / 2
		)
		const brushHeight = Math.min(
			screenBounds.h / editor.getZoomLevel() / maxScreenFactor / 2,
			this.initialViewport.h / 2
		)

		const currentPagePoint = editor.inputs.getCurrentPagePoint()
		const topLeft = currentPagePoint.clone().addXY(-brushWidth, -brushHeight)
		const bottomRight = currentPagePoint.clone().addXY(brushWidth, brushHeight)
		this.zoomBrush = Box.FromPoints([topLeft, bottomRight])
		editor.updateInstanceState({ zoomBrush: this.zoomBrush.toJson() })
	}

	private zoomToNewViewport() {
		if (this.didZoom) return
		const { editor } = this

		const newViewport = this.zoomBrush ?? this.initialViewport
		editor.zoomToBounds(newViewport, { inset: 0 })

		this.zoomBrush = null
		editor.updateInstanceState({ zoomBrush: null })
		this.didZoom = true
	}
}
