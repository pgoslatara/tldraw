import { SuggestionKeyDownProps, SuggestionProps } from '@tiptap/suggestion'
import { type Picker } from 'emoji-mart'
import {
	forwardRef,
	lazy,
	Suspense,
	useCallback,
	useEffect,
	useImperativeHandle,
	useRef,
	useState,
} from 'react'
import { createRoot, Root } from 'react-dom/client'
import { BreakPointProvider, ContainerProvider, EditorProvider, useEditor, useValue } from 'tldraw'
import { globalEditor } from '../../utils/globalEditor'
import { type EmojiMartData } from './EmojiDialog'
import { Emoji } from './emoji'

const EmojiDialog = lazy(() => import('./EmojiDialog'))

interface EmojiDialogWrapperHandle {
	onKeyDown(props: SuggestionKeyDownProps): boolean
}

const EmojiDialogWrapper = forwardRef((props: SuggestionProps, ref) => {
	const editor = globalEditor.get()
	if (!editor) throw Error('Editor not found')
	return (
		<EditorProvider editor={editor}>
			<BreakPointProvider>
				<ContainerProvider container={editor.getContainer()}>
					<EmojiDialogWrapperInner {...props} ref={ref} />
				</ContainerProvider>
			</BreakPointProvider>
		</EditorProvider>
	)
})

const EmojiDialogWrapperInner = forwardRef((props: SuggestionProps, ref) => {
	const [emojiSearchText, setEmojiSearchText] = useState('')
	const [emojiPicker, setEmojiPicker] = useState<any>(null)
	const emojiDialogRef = useRef<HTMLDivElement>(null)
	const editor = useEditor()
	const currentCamera = useValue('camera', () => editor.getCamera(), [editor])

	// Use the initial rect so we don't keep moving the dialog as we type.
	const clientRect = useRef(props.clientRect?.())

	const handlePickerLoaded = useCallback((ep: Picker) => {
		setEmojiPicker(ep)
	}, [])

	const resetSearch = useCallback(() => {
		setEmojiSearchText('')
	}, [])

	useEffect(() => {
		clientRect.current = props.clientRect?.()
		if (clientRect.current && emojiDialogRef.current) {
			emojiDialogRef.current.style.transform = `translate(${clientRect.current.left}px, ${clientRect.current.bottom}px)`
		}
	}, [props, currentCamera])

	const selectItem = useCallback(
		(emoji: EmojiMartData) => {
			props.command({ emoji: emoji.native })
			resetSearch()
		},
		[props, resetSearch]
	)

	useImperativeHandle(ref, () => {
		return {
			onKeyDown: (props: SuggestionKeyDownProps) => {
				const picker = emojiPicker?.component
				if (!picker) return false

				switch (props.event.key) {
					case 'Enter':
					case 'ArrowLeft':
					case 'ArrowRight':
					case 'ArrowUp':
					case 'ArrowDown': {
						picker.handleSearchKeyDown({
							key: props.event.key,
							repeat: props.event.repeat,
							currentTarget: picker.refs.searchInput.current,
							preventDefault: () => {
								/* shim */
							},
							stopImmediatePropagation: () => {
								/* shim */
							},
						})

						return true
					}

					case 'Backspace': {
						if (!emojiSearchText) {
							resetSearch()
							break
						}

						const text = emojiSearchText.slice(0, -1)
						if (picker) {
							picker.refs.searchInput.current.value = text
							picker.handleSearchInput()
						}
						setEmojiSearchText(text)

						break
					}

					default: {
						if (props.event.key.length === 1 && props.event.key.match(/[a-z0-9-_]/i)) {
							picker.refs.searchInput.current.value = emojiSearchText + props.event.key
							picker.handleSearchInput()
							setEmojiSearchText(emojiSearchText + props.event.key)
						}
						break
					}
				}

				return false
			},
		}
	}, [emojiPicker, emojiSearchText, resetSearch])

	if (!clientRect.current) return null

	// We have this wrapper around EmojiDialog because the import is heavier and we want
	// to load it on demand.
	return (
		<Suspense fallback={<div />}>
			<EmojiDialog
				ref={emojiDialogRef}
				top={clientRect.current.bottom}
				left={clientRect.current.left}
				onEmojiSelect={selectItem}
				onClickOutside={resetSearch}
				onPickerLoaded={handlePickerLoaded}
			/>
		</Suspense>
	)
})

export default Emoji.configure({
	suggestion: {
		allowSpaces: false,

		render: () => {
			let root: Root | null = null
			let wrapperRef: EmojiDialogWrapperHandle | null = null

			const unmount = () => {
				root?.unmount()
				root = null
				wrapperRef = null
				document.getElementById('tl-emoji-menu-root')?.remove()
			}

			return {
				onStart: (props: SuggestionProps) => {
					document.getElementById('tl-emoji-menu-root')?.remove()
					const div = document.createElement('div')
					div.id = 'tl-emoji-menu-root'
					document.body.appendChild(div)

					root = createRoot(div)
					root.render(
						<EmojiDialogWrapper
							{...props}
							ref={(ref: EmojiDialogWrapperHandle | null) => {
								wrapperRef = ref
							}}
						/>
					)
				},

				onUpdate(props: SuggestionProps) {
					root?.render(
						<EmojiDialogWrapper
							{...props}
							ref={(ref: EmojiDialogWrapperHandle | null) => {
								wrapperRef = ref
							}}
						/>
					)
				},

				onKeyDown(props: SuggestionKeyDownProps) {
					if (props.event.key === 'Escape') {
						unmount()
						return true
					}

					return !!wrapperRef?.onKeyDown(props)
				},

				onExit() {
					unmount()
				},
			}
		},
	},
})
