export default class Select {
    constructor(element, options) {
        const defaultOptions = {
            data: null,
            searchable: false
        }
        this.el = element;
        this.config = Object.assign({}, defaultOptions, options || {});

        this.data = this.config.data;
        this.selectedOptions = [];

        this.placeholder = this.attr(this.el, "placeholder") || this.config.placeholder || "Select an option";

        this.dropdown = null;
        this.multiple = this.attr(this.el, "multiple");
        this.disabled = this.attr(this.el, "disabled");

        this.create();
    }

    create() {
        this.el.style.display = "none";
        if (this.data) {
            this.processData(this.data);
        } else {
            this.extractData();
        }

        this.renderDropdown();
        this.bindEvent();
    }

    processData(data) {
        var options = [];
        data.forEach(function (item) {
            options.push({
                data: item,
                attributes: {
                    selected: false,
                    disabled: false
                }
            });
        });
        this.options = options;
    };

    extractData() {
        var options = this.el.querySelectorAll("option");
        var data = [];
        var allOptions = [];
        var selectedOptions = [];

        options.forEach(item => {
            var itemData = {
                text: item.innerText,
                value: item.value
            };

            var attributes = {
                selected: item.getAttribute("selected") != null,
                disabled: item.getAttribute("disabled") != null
            };

            data.push(itemData);
            allOptions.push({
                data: itemData,
                attributes: attributes
            });
        });

        this.data = data;
        this.options = allOptions;
        this.options.forEach(function (item) {
            if (item.attributes.selected) selectedOptions.push(item);
        });

        this.selectedOptions = selectedOptions;
    }

    renderDropdown() {
        var classes = [
            "nice-select",
            this.attr(this.el, "class") || "",
            this.disabled ? "disabled" : "",
            this.multiple ? "has-multiple" : ""
        ];

        let searchHtml = `<div class="nice-select-search-box">
      <input type="text" class="nice-select-search" placeholder="Search..."/>
      </div>`;

        var html = `<div class="${classes.join(" ")}" tabindex="${
          this.disabled ? null : 0
        }">
        <span class="${this.multiple ? "multiple-options" : "current"}"></span>
        <div class="nice-select-dropdown">
        ${this.config.searchable ? searchHtml : ""}
        <ul class="list"></ul>
        </div></div>
      `;

        this.el.insertAdjacentHTML("afterend", html);

        this.dropdown = this.el.nextElementSibling;
        this._renderSelectedItems();
        this._renderItems();
    }

    _renderSelectedItems() {
        if (this.multiple) {
            var selectedHtml = "";

            this.selectedOptions.forEach(function (item) {
                selectedHtml += `<span class="current">${item.data.text}</span>`;
            });
            selectedHtml = selectedHtml == "" ? this.placeholder : selectedHtml;

            this.dropdown.querySelector(".multiple-options").innerHTML = selectedHtml;
        } else {
            var html =
                this.selectedOptions.length > 0 ?
                this.selectedOptions[0].data.text :
                this.placeholder;

            this.dropdown.querySelector(".current").innerHTML = html;
        }
    }

    _renderItems() {
        var ul = this.dropdown.querySelector("ul");
        this.options.forEach(item => {
            ul.appendChild(this._renderItem(item));
        });
    }

    _renderItem(option) {
        var el = document.createElement("li");
        el.setAttribute("data-value", option.data.value);

        var classList = [
            "option",
            option.attributes.selected ? "selected" : null,
            option.attributes.disabled ? "disabled" : null
        ];

        el.classList.add(...classList);
        el.innerHTML = option.data.text;
        el.addEventListener("click", this._onItemClicked.bind(this, option));
        option.element = el;
        return el;
    }

    update() {
        this.extractData();
        if (this.dropdown) {
            var open = this.hasClass(this.dropdown, "open");
            this.dropdown.parentNode.removeChild(this.dropdown);
            this.create();

            if (open) {
                triggerClick(this.dropdown);
            }
        }
    }

    disable() {
        if (!this.disabled) {
            this.disabled = true;
            this.addClass(this.dropdown, "disabled");
        }
    }

    enable() {
        if (this.disabled) {
            this.disabled = false;
            this.removeClass(this.dropdown, "disabled");
        }
    }

    clear() {
        this.selectedOptions = [];
        this._renderSelectedItems();
        this.updateSelectValue();
        this.triggerChange(this.el);
    };

    destroy() {
        if (this.dropdown) {
            this.dropdown.parentNode.removeChild(this.dropdown);
            this.el.style.display = "";
        }
    };

    bindEvent() {
        var $this = this;
        this.dropdown.addEventListener("click", this._onClicked.bind(this));
        this.dropdown.addEventListener("keydown", this._onKeyPressed.bind(this));
        window.addEventListener("click", this._onClickedOutside.bind(this));

        if (this.config.searchable) {
            this._bindSearchEvent();
        }
    };

    _bindSearchEvent() {
        var searchBox = this.dropdown.querySelector(".nice-select-search");
        if (searchBox)
            searchBox.addEventListener("click", function (e) {
                e.stopPropagation();
                return false;
            });

        searchBox.addEventListener("input", this._onSearchChanged.bind(this));
    };

    _onClicked(e) {
        this.dropdown.classList.toggle("open");

        if (this.dropdown.classList.contains("open")) {
            var search = this.dropdown.querySelector(".nice-select-search");
            if (search) {
                search.value = "";
                search.focus();
            }

            var t = this.dropdown.querySelector(".focus");
            this.removeClass(t, "focus");
            t = this.dropdown.querySelector(".selected");
            this.addClass(t, "focus");
            this.dropdown.querySelectorAll("ul li").forEach(function (item) {
                item.style.display = "";
            });
        } else {
            this.dropdown.focus();
        }
    };

    _onItemClicked(option, e) {
        var optionEl = e.target;

        if (!this.hasClass(optionEl, "disabled")) {
            if (this.multiple) {
                if (!this.hasClass(optionEl, "selected")) {
                    this.addClass(optionEl, "selected");
                    this.selectedOptions.push(option);
                }
            } else {
                this.selectedOptions.forEach((item) => {
                    this.removeClass(item.element, "selected");
                });

                this.addClass(optionEl, "selected");
                this.selectedOptions = [option];
            }

            this._renderSelectedItems();
            this.updateSelectValue();
        }
    };

    updateSelectValue() {
        if (this.multiple) {
            this.selectedOptions.each(function (item) {
                var el = this.el.querySelector('option[value="' + item.data.value + '"]');
                if (el) el.setAttribute("selected", true);
            });
        } else if (this.selectedOptions.length > 0) {
            this.el.value = this.selectedOptions[0].data.value;
        }
        this.triggerChange(this.el);
    };

    _onClickedOutside(e) {
        console.log('here',e.target)
        if (!this.dropdown.contains(e.target)) {
            this.dropdown.classList.remove("open");
        }
    };

    _onKeyPressed(e) {
        // Keyboard events

        var focusedOption = this.dropdown.querySelector(".focus");

        var open = this.dropdown.classList.contains("open");

        // Space or Enter
        if (e.keyCode == 32 || e.keyCode == 13) {
            if (open) {
                this.triggerClick(focusedOption);
            } else {
                this.triggerClick(this.dropdown);
            }
        } else if (e.keyCode == 40) {
            // Down
            if (!open) {
                this.triggerClick(this.dropdown);
            } else {
                var next = this._findNext(focusedOption);
                if (next) {
                    var t = this.dropdown.querySelector(".focus");
                    this.removeClass(t, "focus");
                    this.addClass(next, "focus");
                }
            }
            e.preventDefault();
        } else if (e.keyCode == 38) {
            // Up
            if (!open) {
                triggerClick(this.dropdown);
            } else {
                var prev = this._findPrev(focusedOption);
                if (prev) {
                    var t = this.dropdown.querySelector(".focus");
                    this.removeClass(t, "focus");
                    this.addClass(prev, "focus");
                }
            }
            e.preventDefault();
        } else if (e.keyCode == 27 && open) {
            // Esc
            this.triggerClick(this.dropdown);
        }
        return false;
    };

    _findNext(el) {
        if (el) {
            el = el.nextElementSibling;
        } else {
            el = this.dropdown.querySelector(".list .option");
        }

        while (el) {
            if (!this.hasClass(el, "disabled") && el.style.display != "none") {
                return el;
            }
            el = el.nextElementSibling;
        }

        return null;
    };

    _findPrev(el) {
        if (el) {
            el = el.previousElementSibling;
        } else {
            el = this.dropdown.querySelector(".list .option:last-child");
        }

        while (el) {
            if (!this.hasClass(el, "disabled") && el.style.display != "none") {
                return el;
            }
            el = el.previousElementSibling;
        }

        return null;
    };

    _onSearchChanged(e) {
        var open = this.dropdown.classList.contains("open");
        var text = e.target.value;
        text = text.toLowerCase();

        if (text == "") {
            this.options.forEach(function (item) {
                item.element.style.display = "";
            });
        } else if (open) {
            var matchReg = new RegExp(text);
            this.options.forEach(function (item) {
                var optionText = item.data.text.toLowerCase();
                var matched = matchReg.test(optionText);
                item.element.style.display = matched ? "" : "none";
            });
        }

        this.dropdown.querySelectorAll(".focus").forEach((item) => {
            this.removeClass(item, "focus");
        });

        var firstEl = this._findNext(null);
        this.addClass(firstEl, "focus");
    }
    triggerClick(el) {
        var event = document.createEvent("MouseEvents");
        event.initEvent("click", true, false);
        el.dispatchEvent(event);
    }

    triggerChange(el) {
        var event = document.createEvent("HTMLEvents");
        event.initEvent("change", true, false);
        el.dispatchEvent(event);
    }

    attr(el, key) {
        return el.getAttribute(key);
    }

    data(el, key) {
        return el.getAttribute("data-" + key);
    }

    hasClass(el, className) {
        if (el) return el.classList.contains(className);
        else return false;
    }

    addClass(el, className) {
        if (el) return el.classList.add(className);
    }

    removeClass(el, className) {
        if (el) return el.classList.remove(className);
    }
}