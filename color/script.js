const noMethod = { from: null, to: null };

const app = new Vue({
	data: () => ({
		base16: "0123456789abcdef",
		hexRange: [],
		value: "",
		method: noMethod,
		copied: false,
		darkMode: "light"
	}),

	created() {
		const digits = this.base16.split("");
		digits.forEach((outer) => {
			digits.forEach((inner) => {
				this.hexRange.push(outer + inner);
			});
		});
	},

	watch: {
		value(next, prev) {
			if (
				next.match(/^rgba/) ||
				(next.match(/,/g) && next.match(/,/g).length == 3)
			) {
				this.method = { from: "RGBA", to: "Hex + alpha" };
			} else if (["r", "R"].includes(next.substr(0, 1)) || next.includes(",")) {
				this.method = { from: "RGB", to: "Hex" };
			} else if (next.match(/^#?([a-f0-9]{4}$|[a-f0-9]{8})/i)) {
				this.method = { from: "Hex + alpha", to: "RGBA" };
			} else if (next.match(/[a-f0-9]+/i)) {
				this.method = { from: "Hex", to: "RGB" };
			} else {
				this.method = noMethod;
			}
		}
	},

	methods: {
		convert(val) {
			if (val.match(/^rgb.*/) || val.match(/.*,.*/)) {
				return this.rgbToHex(val);
			} else {
				return this.hexToRGB(val);
			}
		},

		hexToRGB(val) {
			//Remove '#' from string if present
			if (val.substr(0, 1) === "#") {
				val = val.substr(1);
			}
			//Make sure we have the right number of characters
			if ([3, 4, 6, 8].includes(val.length)) {
				//Allow for hex shorthand (3 or 4 characters)
				const division = val.length >= 6 ? 2 : 1;
				const color = {
					r: { from: val.substr(0, division) },
					g: { from: val.substr(division, division) },
					b: { from: val.substr(division * 2, division) },
					a: { from: val.substr(division * 3, division) }
				};

				//Set single-character shorthands to double-character hexes
				if (division === 1) {
					["r", "g", "b", "a"].forEach((col) => {
						color[col].from += color[col].from;
					});
				}

				//Matches the hex values to their 0-255 counterparts
				this.hexRange.forEach((hex, index) => {
					Object.keys(color).forEach((key) => {
						if (color[key].from.toLowerCase() == hex) {
							color[key].to = index;
						}
					});
				});

				//See if an alpha value was provided (return RGBA or RGB)
				if (color.a.to) {
					return `rgba(${color.r.to}, ${color.g.to}, ${color.b.to}, ${(
						color.a.to / 255
					).toFixed(2)})`;
				} else {
					return `rgb(${color.r.to}, ${color.g.to}, ${color.b.to})`;
				}
			} else {
				return null;
			}
		},

		rgbToHex(val) {
			//Don't try to do stuff if we don't have two commas and a number
			if (!val.match(/.*,.*,[0-9\s]+/)) return;

			//Split up the RGB(A) string on commas and match numbers
			const rgba = val.split(",");
			const vals = rgba.map((color) => color && color.match(/[0-9\.]+/));
			let invalid = false;

			//Make sure none of the numbers are larger than 255
			vals.forEach((val) => {
				if (val > 255) invalid = true;
			});

			//Make sure we have 3 or 4 numbers (RGB or RGBA)
			if ([3, 4].includes(vals.length)) {
				let finalHex = "";
				vals.forEach((color, colorIndex) => {
					//If we're dealing with the alpha value…
					if (colorIndex == 3)
						color = Math.ceil(color * 255 > 255 ? 255 : color * 255);
					this.hexRange.forEach((hex, hexIndex) => {
						if (color == hexIndex) finalHex += hex;
					});
				});
				return invalid ? null : `#${finalHex}`;
			}
		},

		validate(key) {
			//Only allow the characters that go into RGBA and/or hex volors
			this.value = this.value.replace(/[^#a-f0-9rg\(\),\s\.]/, "");
		},

		copy() {
			this.$refs.output.select();
			document.execCommand("copy");
			this.copied = true;
			this.$refs.copyButton.focus();
			setTimeout(() => {
				this.copied = false;
			}, 1200);
		}
	},

	computed: {
		convertedValue() {
			return this.convert(this.value);
		},

		fromFormat() {
			return this.method && this.method.from ? this.method.from : "…";
		},

		toFormat() {
			return this.method && this.method.to ? this.method.to : "…";
		},

		copyButtonText() {
			return this.copied ? "Copied!" : "Copy";
		},

		boxShadow() {
			return `.5rem .5rem 0 ${this.convert(this.value) || "rgba(0,0,0,.25)"}`;
		},

		borderColor() {
			return this.convert(this.value) || "inherit";
		},

		backgroundColor() {
			return this.convert(this.value) || "";
		}
	}
});

app.$mount(document.querySelector("main"));