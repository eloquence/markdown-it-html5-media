(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.html5Media = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';
/* eslint complexity: "off" */

/**
 * A minimalist `markdown-it` plugin for parsing video/audio references inside
 * markdown image syntax as `<video>` / `<audio>` tags.
 *
 * @namespace HTML5Media
 */
// We can only detect video/audio files from the extension in the URL.
// We ignore MP1 and MP2 (not in active use) and default to video for ambiguous
// extensions (MPG, MP4)

function _createForOfIteratorHelper(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

var validAudioExtensions = ['aac', 'm4a', 'mp3', 'oga', 'ogg', 'wav'];
var validVideoExtensions = ['mp4', 'm4v', 'ogv', 'webm', 'mpg', 'mpeg'];
/**
 * @property {Object} messages
 * @property {Object} messages.languageCode
 *  a set of messages identified with a language code, typically an ISO639 code
 * @property {String} messages.languageCode.messageKey
 *  an individual translation of a message to that language, identified with a
 *  message key
 * @typedef {Object} MessagesObj
 */

var messages = {
  en: {
    'html5 video not supported': 'Your browser does not support playing HTML5 video.',
    'html5 audio not supported': 'Your browser does not support playing HTML5 audio.',
    'html5 media fallback link': 'You can <a href="%s" download>download the file</a> instead.',
    'html5 media description': 'Here is a description of the content: %s'
  }
};
/**
 * You can override this function using options.translateFn.
 *
 * @param {String} language
 *  a language code, typically an ISO 639-[1-3] code.
 * @param {String} messageKey
 *  an identifier for the message, typically a short descriptive text
 * @param {String[]} messageParams
 *  Strings to be substituted into the message using some pattern, e.g., %s or
 *  %1$s, %2$s. By default we only use a simple %s pattern.
 * @returns {String}
 *  the translation to use
 * @memberof HTML5Media
 */

var translate = function translate(language, messageKey, messageParams) {
  // Revert back to English default if no message object, or no translation
  // for this language
  if (!messages[language] || !messages[language][messageKey]) language = 'en';
  if (!messages[language]) return '';
  var message = messages[language][messageKey] || '';

  if (messageParams) {
    var _iterator = _createForOfIteratorHelper(messageParams),
        _step;

    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var param = _step.value;
        message = message.replace('%s', param);
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
  }

  return message;
};
/**
 * A fork of the built-in image tokenizer which guesses video/audio files based
 * on their extension, and tokenizes them accordingly.
 *
 * @param {Object} state
 *  Markdown-It state
 * @param {Boolean} silent
 *  if true, only validate, don't tokenize
 * @param {MarkdownIt} md
 *  instance of Markdown-It used for utility functions
 * @returns {Boolean}
 * @memberof HTML5Media
 */


function tokenizeImagesAndMedia(state, silent, md) {
  var attrs, code, content, label, labelEnd, labelStart, pos, ref, res, title, token, tokens, start;
  var href = '',
      oldPos = state.pos,
      max = state.posMax; // Exclamation mark followed by open square bracket - ![ - otherwise abort

  if (state.src.charCodeAt(state.pos) !== 0x21 || state.src.charCodeAt(state.pos + 1) !== 0x5B) return false;
  labelStart = state.pos + 2;
  labelEnd = state.md.helpers.parseLinkLabel(state, state.pos + 1, false); // Parser failed to find ']', so it's not a valid link

  if (labelEnd < 0) return false;
  pos = labelEnd + 1;

  if (pos < max && state.src.charCodeAt(pos) === 0x28) {
    // Parenthesis: (
    //
    // Inline link
    //
    // [link](  <href>  "title"  )
    //        ^^ skipping these spaces
    pos++;

    for (; pos < max; pos++) {
      code = state.src.charCodeAt(pos);
      if (!md.utils.isSpace(code) && code !== 0x0A) // LF \n
        break;
    }

    if (pos >= max) return false; // [link](  <href>  "title"  )
    //          ^^^^^^ parsing link destination

    start = pos;
    res = state.md.helpers.parseLinkDestination(state.src, pos, state.posMax);

    if (res.ok) {
      href = state.md.normalizeLink(res.str);

      if (state.md.validateLink(href)) {
        pos = res.pos;
      } else {
        href = '';
      }
    } // [link](  <href>  "title"  )
    //                ^^ skipping these spaces


    start = pos;

    for (; pos < max; pos++) {
      code = state.src.charCodeAt(pos);
      if (!md.utils.isSpace(code) && code !== 0x0A) break;
    } // [link](  <href>  "title"  )
    //                  ^^^^^^^ parsing link title


    res = state.md.helpers.parseLinkTitle(state.src, pos, state.posMax);

    if (pos < max && start !== pos && res.ok) {
      title = res.str;
      pos = res.pos; // [link](  <href>  "title"  )
      //                         ^^ skipping these spaces

      for (; pos < max; pos++) {
        code = state.src.charCodeAt(pos);
        if (!md.utils.isSpace(code) && code !== 0x0A) break;
      }
    } else {
      title = '';
    }

    if (pos >= max || state.src.charCodeAt(pos) !== 0x29) {
      // Parenthesis: )
      state.pos = oldPos;
      return false;
    }

    pos++;
  } else {
    //
    // Link reference
    //
    if (typeof state.env.references === 'undefined') return false;

    if (pos < max && state.src.charCodeAt(pos) === 0x5B) {
      // Bracket: [
      start = pos + 1;
      pos = state.md.helpers.parseLinkLabel(state, pos);

      if (pos >= 0) {
        label = state.src.slice(start, pos++);
      } else {
        pos = labelEnd + 1;
      }
    } else {
      pos = labelEnd + 1;
    } // covers label === '' and label === undefined
    // (collapsed reference link and shortcut reference link respectively)


    if (!label) label = state.src.slice(labelStart, labelEnd);
    ref = state.env.references[md.utils.normalizeReference(label)];

    if (!ref) {
      state.pos = oldPos;
      return false;
    }

    href = ref.href;
    title = ref.title;
  }

  state.pos = pos;
  state.posMax = max;
  if (silent) return true; // We found the end of the link, and know for a fact it's a valid link;
  // so all that's left to do is to call tokenizer.

  content = state.src.slice(labelStart, labelEnd);
  state.md.inline.parse(content, state.md, state.env, tokens = []);
  var mediaType = guessMediaType(href);
  var tag = mediaType == 'image' ? 'img' : mediaType;
  token = state.push(mediaType, tag, 0);
  token.attrs = attrs = [['src', href]];
  if (mediaType == 'image') attrs.push(['alt', '']);
  token.children = tokens;
  token.content = content;
  if (title) attrs.push(['title', title]);
  state.pos = pos;
  state.posMax = max;
  return true;
}
/**
 * Guess the media type represented by a URL based on the file extension,
 * if any
 *
 * @param {String} url
 *  any valid URL
 * @returns {String}
 *  a type identifier: 'image' (default for all unrecognized URLs), 'audio'
 *  or 'video'
 * @memberof HTML5Media
 */


function guessMediaType(url) {
  var extensionMatch = url.match(/\.([^/.]+)$/);
  if (extensionMatch === null) return 'image';
  var extension = extensionMatch[1];
  if (validAudioExtensions.indexOf(extension.toLowerCase()) != -1) return 'audio';else if (validVideoExtensions.indexOf(extension.toLowerCase()) != -1) return 'video';else return 'image';
}
/**
 * Render tokens of the video/audio type to HTML5 tags
 *
 * @param {Object} tokens
 *  token stream
 * @param {Number} idx
 *  which token are we rendering
 * @param {Object} options
 *  Markdown-It options, including this plugin's settings
 * @param {Object} env
 *  Markdown-It environment, potentially including language setting
 * @param {MarkdownIt} md
 *  instance used for utilities access
 * @returns {String}
 *  rendered token
 * @memberof HTML5Media
 */


function renderMedia(tokens, idx, options, env, md) {
  var token = tokens[idx];
  var type = token.type;
  if (type !== 'video' && type !== 'audio') return '';
  var attrs = options.html5Media["".concat(type, "Attrs")].trim();
  if (attrs) attrs = ' ' + attrs; // We'll always have a URL for non-image media: they are detected by URL

  var url = token.attrs[token.attrIndex('src')][1]; // Title is set like this: ![descriptive text](video.mp4 "title")

  var title = token.attrIndex('title') != -1 ? " title=\"".concat(md.utils.escapeHtml(token.attrs[token.attrIndex('title')][1]), "\"") : '';
  var fallbackText = translate(env.language, "html5 ".concat(type, " not supported")) + '\n' + translate(env.language, 'html5 media fallback link', [url]);
  var description = token.content ? '\n' + translate(env.language, 'html5 media description', [md.utils.escapeHtml(token.content)]) : '';
  return "<".concat(type, " src=\"").concat(url, "\"").concat(title).concat(attrs, ">\n") + "".concat(fallbackText).concat(description, "\n") + "</".concat(type, ">");
}
/**
 * The main plugin function, exported as module.exports
 *
 * @param {MarkdownIt} md
 *  instance, automatically passed by md.use
 * @param {Object} [options]
 *  configuration
 * @param {String} [options.videoAttrs='controls class="html5-video-player"']
 *  attributes to include inside `<video>` tags
 * @param {String} [options.audioAttrs='controls class="html5-audio-player"']
 *  attributes to include inside `<audio>` tags
 * @param {MessagesObj} [options.messages=built-in messages]
 *  human-readable text that is part of the output
 * @memberof HTML5Media
 */


function html5Media(md) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  if (options.messages) messages = options.messages;
  if (options.translateFn) translate = options.translateFn;
  var videoAttrs = options.videoAttrs !== undefined ? options.videoAttrs : 'controls class="html5-video-player"';
  var audioAttrs = options.audioAttrs !== undefined ? options.audioAttrs : 'controls class="html5-audio-player"';
  md.inline.ruler.at('image', function (tokens, silent) {
    return tokenizeImagesAndMedia(tokens, silent, md);
  });

  md.renderer.rules.video = md.renderer.rules.audio = function (tokens, idx, opt, env) {
    opt.html5Media = {
      videoAttrs: videoAttrs,
      audioAttrs: audioAttrs
    };
    return renderMedia(tokens, idx, opt, env, md);
  };
}

module.exports = {
  html5Media: html5Media,
  messages: messages,
  // For partial customization of messages
  guessMediaType: guessMediaType
};
},{}]},{},[1])(1)
});
