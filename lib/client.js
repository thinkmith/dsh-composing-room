window.__ModuleLoader__.load({
	id: "dsh-composing-room",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		const react = require("react");

		/** Only the slot registry is needed: the state lives behind one HTTP route. */
		const inject = ["slots"];

		const ENDPOINT = "/api/composing-room";

		/**
		 * Call the host half and report both the payload and what went wrong.
		 * @param init - fetch options.
		 * @returns `{ state }` on success or `{ error }` with a short reason.
		 */
		async function call(init) {
			try {
				const response = await fetch(ENDPOINT, {
					credentials: "same-origin",
					headers: { accept: "application/json" },
					...init,
				});
				if (!response.ok) return { error: `HTTP ${String(response.status)}` };
				return { state: await response.json() };
			} catch (error) {
				return { error: String(error && error.message ? error.message : error) };
			}
		}

		const readState = () => call({});

		const toggleState = () => call({ method: "POST" });

		/** Chip in the composer's trailing control row: one click arms or drops the section. */
		function RoomButton() {
			const [snap, setSnap] = react.useState(void 0);
			const [error, setError] = react.useState("");

			react.useEffect(() => {
				let alive = true;
				const load = async () => {
					const result = await readState();
					if (!alive) return;
					if (result.state !== void 0) {
						setSnap(result.state);
						setError("");
					} else setError(result.error || "unreachable");
				};
				load();
				const timer = setInterval(load, 3000);
				return () => {
					alive = false;
					clearInterval(timer);
				};
			}, []);

			const armed = snap?.armed === true;
			const chars = typeof snap?.chars === "number" ? snap.chars : 0;
			const order = typeof snap?.order === "number" ? snap.order : 12000;
			const broken = snap === void 0 && error !== "";

			const onClick = async () => {
				setSnap((prev) => (prev === void 0 ? prev : { ...prev, armed: !prev.armed }));
				const result = await toggleState();
				if (result.state !== void 0) {
					setSnap(result.state);
					setError("");
				} else setError(result.error || "unreachable");
			};

			const tone = broken
				? "rgba(232,96,96,0.95)"
				: armed
					? "rgba(0,204,150,0.95)"
					: "rgba(150,150,160,0.8)";

			const dot = react.createElement("span", {
				style: {
					width: 6,
					height: 6,
					borderRadius: 3,
					background: tone,
					boxShadow: armed && !broken ? "0 0 6px rgba(0,204,150,0.8)" : "none",
					flex: "0 0 auto",
				},
			});

			const text = broken ? "排版 ?" : armed ? "排版 开" : "排版 关";

			const label = react.createElement("span", null, text);

			let title;
			if (broken) title = `宿主路由没接上：${error}（GET ${ENDPOINT}）`;
			else if (armed) title = `排版台已开 · ${String(chars)} 字符 · order ${String(order)}（点击关闭）`;
			else title = `排版台已关（点击开启 · ${String(chars)} 字符 · order ${String(order)}）`;

			return react.createElement(
				"button",
				{
					type: "button",
					onClick,
					title,
					style: {
						height: 24,
						padding: "0 8px",
						display: "inline-flex",
						alignItems: "center",
						gap: 5,
						borderRadius: 999,
						border: `1px solid ${
							broken
								? "rgba(232,96,96,0.5)"
								: armed
									? "rgba(0,190,140,0.55)"
									: "rgba(140,140,150,0.38)"
						}`,
						background: armed && !broken ? "rgba(0,190,140,0.14)" : "transparent",
						color: "inherit",
						font: "inherit",
						fontSize: 12,
						lineHeight: 1,
						cursor: "pointer",
						whiteSpace: "nowrap",
					},
				},
				dot,
				label,
			);
		}

		/**
		 * Client plugin body: occupy one cell of the composer's trailing row.
		 * @param ctx - client root context.
		 */
		function apply(ctx) {
			ctx.slots.inject("conversation.input.right", () =>
				ctx.slots.register(
					{
						name: "conversation.input.right",
						id: "composing-room",
						order: 5,
					},
					RoomButton,
				),
			);
		}

		exports.apply = apply;
		exports.inject = inject;
		exports.RoomButton = RoomButton;
		return module.exports;
	},
});
