const { GObject, Gtk, Adw, GLib } = imports.gi;
const Misc = imports.src.misc;

var CustomButton = GObject.registerClass({
    GTypeName: 'ClapperCustomButton',
},
class ClapperCustomButton extends Gtk.Button
{
    _init(opts)
    {
        opts = opts || {};

        const defaults = {
            halign: Gtk.Align.CENTER,
            valign: Gtk.Align.CENTER,
            can_focus: false,
        };
        Object.assign(opts, defaults);

        super._init(opts);

        this.add_css_class('flat');
        this.add_css_class('clappercontrolsbutton');
    }

    vfunc_clicked()
    {
        const clapperWidget = this.get_ancestor(Gtk.Grid);

        if(clapperWidget.isFullscreenMode)
            clapperWidget.revealControls();
    }
});

var IconToggleButton = GObject.registerClass({
    GTypeName: 'ClapperIconToggleButton',
},
class ClapperIconToggleButton extends CustomButton
{
    _init(primaryIcon, secondaryIcon)
    {
        super._init({
            icon_name: primaryIcon,
        });

        this.primaryIcon = primaryIcon;
        this.secondaryIcon = secondaryIcon;
    }

    setPrimaryIcon()
    {
        this.icon_name = this.primaryIcon;
    }

    setSecondaryIcon()
    {
        this.icon_name = this.secondaryIcon;
    }
});

var PopoverSeparator = GObject.registerClass({
    GTypeName: 'ClapperPopoverSeparator',
    Template: Misc.getResourceUri('ui/popover-separator.ui'),
    InternalChildren: ['middle_label'],
    Properties: {
        'label': GObject.ParamSpec.string(
            'label',
            'Middle label',
            'Text to set in the middle',
            GObject.ParamFlags.WRITABLE,
            null
        ),
    }
},
class ClapperPopoverSeparator extends Gtk.Box
{
    _init(opts)
    {
        super._init();

        if(!opts.label)
            this.visible = false;

        this.label = opts.label;
    }

    set label(value)
    {
        this._middle_label.label = value || "";

        if(value)
            this.visible = true;
    }
});

var PopoverButtonBase = GObject.registerClass({
    GTypeName: 'ClapperPopoverButtonBase',
},
class ClapperPopoverButtonBase extends Gtk.MenuButton
{
    _init(opts = {})
    {
        super._init(opts);

        if(opts.icon_name)
            this.icon_name = opts.icon_name;
        else if(opts.label)
            this.label = opts.label;

        this.toggleButton = this.get_first_child();
        this.toggleButton.add_css_class('clappercontrolsbutton');

        this.set_create_popup_func(this._onPopoverOpened);
        this.popover.connect('closed', this._onPopoverClosed.bind(this));
    }

    _onPopoverOpened(self)
    {
        const clapperWidget = self.get_ancestor(Gtk.Grid);

        if(clapperWidget.isFullscreenMode) {
            clapperWidget.revealControls();
            clapperWidget.isPopoverOpen = true;
        }
    }

    _onPopoverClosed(popover)
    {
        const clapperWidget = this.get_ancestor(Gtk.Grid);

        /* Set again timeout as popover is now closed */
        if(clapperWidget.isFullscreenMode)
            clapperWidget.revealControls();

        clapperWidget.isPopoverOpen = false;
    }
});

var ModelEnumToggleGroup = GObject.registerClass({
    GTypeName: 'ClapperModelEnumToggleGroup',
    Properties: {
        'model': GObject.ParamSpec.object(
            'model',
            'Model',
            'The model to use',
            GObject.ParamFlags.READWRITE,
            Adw.EnumListModel
        ),
        'selected': GObject.ParamSpec.int(
            'selected',
            'Selected',
            'The selected item',
            GObject.ParamFlags.READWRITE,
            0, GLib.MAXINT32, 0
        ),
    }
},
class ClapperModelToggleGroup extends Gtk.Box
{
    _init(opts)
    {
        super._init({orientation: Gtk.Orientation.HORIZONTAL});

        this._model = null;
        this._selected = 0;
        this._buttons = [];
        if (opts.model)
            this.model = opts.model;
    }

    _on_toggled(button)
    {
        if (button.active) {
          this._selected = button.data;
          this.notify("selected");
        }
    }

    set model(value)
    {
        this._model = value;

        let button = null;
        for (let i=0; i < this._model.get_n_items(); i++) {
          let item = this._model.get_item(i);
          button = new Gtk.ToggleButton({label: item.get_name(), group: button});
          button.data = item.get_value();
          let value = item.get_value();
          button.connect("toggled", this._on_toggled.bind(this));
          this.append(button);
        }
    }

    get model()
    {
        return this._model;
    }

    set selected(value)
    {
      let child = this.get_first_child();
      while (child != null) {
        if (child.data == value) {
          child.active = true;
          break;
        }

        child = child.get_next_sibling();
      }
    }

    get selected()
    {
        return this._selected;
    }

});

var ElapsedTimeButton = GObject.registerClass({
    GTypeName: 'ClapperElapsedTimeButton',
    Template: Misc.getResourceUri('ui/elapsed-time-button.ui'),
    Children: ['scrolledWindow', 'speedScale'],
},
class ClapperElapsedTimeButton extends PopoverButtonBase
{
    _init(opts)
    {
        super._init(opts);

        this.setInitialState();
        this.popover.add_css_class('elapsedpopover');

        this.scrolledWindow.max_content_height = 150;
    }

    set label(value)
    {
        this.toggleButton.label = value;
    }

    get label()
    {
        return this.toggleButton.label;
    }

    setInitialState()
    {
        this.label = `00${Misc.timeColon}00∕00${Misc.timeColon}00`;
    }

    setFullscreenMode(isFullscreen, isMobileMonitor)
    {
        this.scrolledWindow.max_content_height = (isFullscreen && !isMobileMonitor)
            ? 190 : 150;
    }
});

var TrackSelectButton = GObject.registerClass({
    GTypeName: 'ClapperTrackSelectButton',
    Template: Misc.getResourceUri('ui/track-select-button.ui'),
    Children: ['popoverBox'],
    InternalChildren: ['scrolled_window', 'decoder_separator'],
},
class ClapperTrackSelectButton extends PopoverButtonBase
{
    _init(opts)
    {
        super._init(opts);

        this._scrolled_window.max_content_height = 220;
    }

    setFullscreenMode(isFullscreen, isMobileMonitor)
    {
        this._scrolled_window.max_content_height = (isFullscreen && !isMobileMonitor)
            ? 290 : 220;
    }

    setDecoder(decoder)
    {
        this._decoder_separator.label = _('Decoder: %s').format(decoder);
    }
});

var VolumeButton = GObject.registerClass({
    GTypeName: 'ClapperVolumeButton',
    Template: Misc.getResourceUri('ui/volume-button.ui'),
    Children: ['volumeScale'],
    Properties: {
        'muted': GObject.ParamSpec.boolean(
            'muted',
            'Set muted',
            'Mark scale as muted',
            GObject.ParamFlags.WRITABLE,
            false
        ),
    }
},
class ClapperVolumeButton extends PopoverButtonBase
{
    _init(opts)
    {
        super._init(opts);
        this._isMuted = false;
    }

    set muted(isMuted)
    {
        this._isMuted = isMuted;
        this._onVolumeScaleValueChanged(this.volumeScale);
    }

    _onVolumeScaleValueChanged(scale)
    {
        const volume = scale.get_value();
        const cssClass = 'overamp';
        const hasOveramp = (scale.has_css_class(cssClass));

        if(volume > 1) {
            if(!hasOveramp)
                scale.add_css_class(cssClass);
        }
        else {
            if(hasOveramp)
                scale.remove_css_class(cssClass);
        }

        const icon = (volume <= 0 || this._isMuted)
            ? 'muted'
            : (volume <= 0.3)
            ? 'low'
            : (volume <= 0.7)
            ? 'medium'
            : (volume <= 1)
            ? 'high'
            : 'overamplified';

        this.icon_name = `audio-volume-${icon}-symbolic`;
    }
});
