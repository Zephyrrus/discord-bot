'use strict';
/**
 * A rich embed to be sent with a message with a fluent interface for creation.
 * @param {Object} [data] Data to set in the rich embed
 */
class RichEmbed {
  constructor(data = {}) {
    /**
     * Title for this Embed
     * @type {string}
     */
    this.title = data.title;

    /**
     * Description for this Embed
     * @type {string}
     */
    this.description = data.description;

    /**
     * URL for this Embed
     * @type {string}
     */
    this.url = data.url;

    /**
     * Color for this Embed
     * @type {number}
     */
    this.color = data.color;

    /**
     * Author for this Embed
     * @type {Object}
     */
    this.author = data.author;

    /**
     * Timestamp for this Embed
     * @type {Date}
     */
    this.timestamp = data.timestamp;

    /**
     * Fields for this Embed
     * @type {Object[]}
     */
    this.fields = data.fields || [];

    /**
     * Thumbnail for this Embed
     * @type {Object}
     */
    this.thumbnail = data.thumbnail;

    /**
     * Image for this Embed
     * @type {Object}
     */
    this.image = data.image;

    /**
     * Footer for this Embed
     * @type {Object}
     */
    this.footer = data.footer;

    /**
     * File to upload alongside this Embed
     * @type {string}
     */
    this.file = data.file;
  }

  /**
   * Sets the title of this embed.
   * @param {StringResolvable} title The title
   * @returns {RichEmbed} This embed
   */
  setTitle(title) {
    title = resolveString(title);
    if (title.length > 256) throw new RangeError('RichEmbed titles may not exceed 256 characters.');
    this.title = title;
    return this;
  }

  /**
   * Sets the description of this embed.
   * @param {StringResolvable} description The description
   * @returns {RichEmbed} This embed
   */
  setDescription(description) {
    description = resolveString(description);
    if (description.length > 2048) throw new RangeError('RichEmbed descriptions may not exceed 2048 characters.');
    this.description = description;
    return this;
  }

  /**
   * Sets the URL of this embed.
   * @param {string} url The URL
   * @returns {RichEmbed} This embed
   */
  setURL(url) {
    this.url = url;
    return this;
  }

  /**
   * Sets the color of this embed.
   * @param {ColorResolvable} color The color of the embed
   * @returns {RichEmbed} This embed
   */
  setColor(color) {
    this.color = resolveColor(color);
    return this;
  }

  /**
   * Sets the author of this embed.
   * @param {StringResolvable} name The name of the author
   * @param {string} [icon] The icon URL of the author
   * @param {string} [url] The URL of the author
   * @returns {RichEmbed} This embed
   */
  setAuthor(name, icon, url) {
    this.author = { name: resolveString(name), icon_url: icon, url };
    return this;
  }

  /**
   * Sets the timestamp of this embed.
   * @param {Date} [timestamp=current date] The timestamp
   * @returns {RichEmbed} This embed
   */
  setTimestamp(timestamp = new Date()) {
    this.timestamp = timestamp;
    return this;
  }

  /**
   * Adds a field to the embed (max 25).
   * @param {StringResolvable} name The name of the field
   * @param {StringResolvable} value The value of the field
   * @param {boolean} [inline=false] Set the field to display inline
   * @returns {RichEmbed} This embed
   */
  addField(name, value, inline = false) {
    if (this.fields.length >= 25) throw new RangeError('RichEmbeds may not exceed 25 fields.');
    name = resolveString(name);
    if (name.length > 256) throw new RangeError('RichEmbed field names may not exceed 256 characters.');
    if (!/\S/.test(name)) throw new RangeError('RichEmbed field names may not be empty.');
    value = resolveString(value);
    if (value.length > 1024) throw new RangeError('RichEmbed field values may not exceed 1024 characters.');
    if (!/\S/.test(value)) throw new RangeError('RichEmbed field values may not be empty.');
    this.fields.push({ name, value, inline });
    return this;
  }

  /**
   * Convenience function for `<RichEmbed>.addField('\u200B', '\u200B', inline)`.
   * @param {boolean} [inline=false] Set the field to display inline
   * @returns {RichEmbed} This embed
   */
  addBlankField(inline = false) {
    return this.addField('\u200B', '\u200B', inline);
  }

  /**
   * Set the thumbnail of this embed.
   * @param {string} url The URL of the thumbnail
   * @returns {RichEmbed} This embed
   */
  setThumbnail(url) {
    this.thumbnail = { url };
    return this;
  }

  /**
   * Set the image of this embed.
   * @param {string} url The URL of the image
   * @returns {RichEmbed} This embed
   */
  setImage(url) {
    this.image = { url };
    return this;
  }

  /**
   * Sets the footer of this embed.
   * @param {StringResolvable} text The text of the footer
   * @param {string} [icon] The icon URL of the footer
   * @returns {RichEmbed} This embed
   */
  setFooter(text, icon) {
    text = resolveString(text);
    if (text.length > 2048) throw new RangeError('RichEmbed footer text may not exceed 2048 characters.');
    this.footer = { text, icon_url: icon };
    return this;
  }

  /**
   * Sets the file to upload alongside the embed. This file can be accessed via `attachment://fileName.extension` when
   * setting an embed image or author/footer icons. Only one file may be attached.
   * @param {FileOptions|string} file Local path or URL to the file to attach, or valid FileOptions for a file to attach
   * @returns {RichEmbed} This embed
   */
  attachFile(file) {
    if (this.file) throw new RangeError('You may not upload more than one file at once.');
    this.file = file;
    return this;
  }
}

module.exports = RichEmbed;

/**
 * Can be a Hex Literal, Hex String, Number, RGB Array, or one of the following
 * ```
 * [
 *   'DEFAULT',
 *   'AQUA',
 *   'GREEN',
 *   'BLUE',
 *   'PURPLE',
 *   'GOLD',
 *   'ORANGE',
 *   'RED',
 *   'GREY',
 *   'DARKER_GREY',
 *   'NAVY',
 *   'DARK_AQUA',
 *   'DARK_GREEN',
 *   'DARK_BLUE',
 *   'DARK_PURPLE',
 *   'DARK_GOLD',
 *   'DARK_ORANGE',
 *   'DARK_RED',
 *   'DARK_GREY',
 *   'LIGHT_GREY',
 *   'DARK_NAVY',
 *   'RANDOM',
 * ]
 * ```
 * or something like
 * ```
 * [255, 0, 255]
 * ```
 * for purple
 * @typedef {string|number|Array} ColorResolvable
 */

const Colors = {
  DEFAULT: 0x000000,
  AQUA: 0x1ABC9C,
  GREEN: 0x2ECC71,
  BLUE: 0x3498DB,
  PURPLE: 0x9B59B6,
  GOLD: 0xF1C40F,
  ORANGE: 0xE67E22,
  RED: 0xE74C3C,
  GREY: 0x95A5A6,
  NAVY: 0x34495E,
  DARK_AQUA: 0x11806A,
  DARK_GREEN: 0x1F8B4C,
  DARK_BLUE: 0x206694,
  DARK_PURPLE: 0x71368A,
  DARK_GOLD: 0xC27C0E,
  DARK_ORANGE: 0xA84300,
  DARK_RED: 0x992D22,
  DARK_GREY: 0x979C9F,
  DARKER_GREY: 0x7F8C8D,
  LIGHT_GREY: 0xBCC0C0,
  DARK_NAVY: 0x2C3E50,
  BLURPLE: 0x7289DA,
  GREYPLE: 0x99AAB5,
  DARK_BUT_NOT_BLACK: 0x2C2F33,
  NOT_QUITE_BLACK: 0x23272A,
};

/**
 * Resolves a ColorResolvable into a color number.
 * @param {ColorResolvable} color Color to resolve
 * @returns {number} A color
 */
function resolveColor(color) {
    if (typeof color === 'string') {
        if (color === 'RANDOM') return Math.floor(Math.random() * (0xFFFFFF + 1));
        color = Colors[color] || parseInt(color.replace('#', ''), 16);
    } else if (color instanceof Array) {
        color = (color[0] << 16) + (color[1] << 8) + color[2];
    }

    if (color < 0 || color > 0xFFFFFF) {
        throw new RangeError('Color must be within the range 0 - 16777215 (0xFFFFFF).');
    } else if (color && isNaN(color)) {
        throw new TypeError('Unable to convert color to a number.');
    }

    return color;
}


function resolveString(data) {
  if (typeof data === 'string') return data;
  if (data instanceof Array) return data.join('\n');
  return String(data);
}
