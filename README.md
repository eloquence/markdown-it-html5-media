# markdown-it-html5-media
![](https://travis-ci.org/eloquence/markdown-it-html5-media.svg?branch=master)

Minimalist &lt;video>/&lt;audio> plugin for markdown-it, using image syntax.

Inspired by [markdown-it-html5-embed](https://github.com/cmrd-senya/markdown-it-html5-embed).
Key differences:

- Only supports image syntax: `![descriptive text](video.mp4)`, which is what
  the CommonMark folks [seem to favor](https://talk.commonmark.org/t/embedded-audio-and-video/)
- Tokenizes video and audio to tokens of the 'video' and 'audio' type (useful
  for working with, e.g., rich text editors that process these tokens)
- No library dependency for file type detection, just a simple extension check
  for commonly used video/audio formats.
- Transpiled version: 10KB unminified vs. 169KB unminified

## Basic usage

````javascript
const md = require('markdown-it')();
// Destructuring assignment; we also export UI messages & media type detection
const { html5Media } = require('markdown-it-html5-media');
md.use(html5Media);
console.log(md.render('![text](video.mp4)'));
````

Output:

````html
<p><video src="video.mp4" controls class="html5-video-player">
Your browser does not support playing HTML5 video.
You can <a href="video.mp4" download>download the file</a> instead.
Here is a description of the content: text
</video></p>
````

## Custom attributes

You can pass any string that will be rendered instead of the default attributes shown above.

````javascript
// Init as above
md.use(html5Media, {
  videoAttrs: 'class="my-video-css"',
  audioAttrs: 'class="my-audio-css" data-collapse'
});
console.log(md.render('![](video.mp4)'));
console.log(md.render('![](audio.mp3)'));
````

Output:

````html
<p><video src="video.mp4" class="my-video-css">
Your browser does not support playing HTML5 video.
You can <a href="video.mp4" download>download the file</a> instead.
</video></p>
<p><audio src="audio.mp3" class="my-audio-css" data-collapse>
Your browser does not support playing HTML5 audio.
You can <a href="audio.mp3" download>download the file</a> instead.
</audio></p>
````

## Media type detection

This module detects the media type by examining the file extension
(case-insensitive). The valid audio and video extensions are defined
[here](https://eloquence.github.io/markdown-it-html5-media/index.js.html#line15).

If you need to perform an identical media type detection outside the module,
you can import the `guessMediaType` function
([docs](https://eloquence.github.io/markdown-it-html5-media/HTML5Media.html#.guessMediaType)):

````javascript
const { guessMediaType } = require('markdown-it-html5-media');
````

## Custom messages

You can customize the fallback text. This text will only be shown to users whose browser does not support HTML5 video or audio at all. %s is used as a substitution marker for the filename or the description.

````javascript
// Init as above
md.use(html5Media, {
  messages: {
    en: {
      'html5 video not supported':
        'Cannot play video.',
      'html5 audio not supported':
        'Cannot play audio.',
      'html5 media fallback link':
        'Download <a href="%s">file</a>.',
      'html5 media description':
        'Description: %s'      
    }
  }
});
console.log(md.render('![text](video.mp4)'));
````

Output:

````html
<p><video src="video.mp4" controls class="html5-video-player">
Cannot play video.
Download <a href="video.mp4">file</a>.
Description: text
</video></p>
````

If you only want to change some of the text, you can import the `messages`
object from the module and partially alter its contents:

````javascript
const { html5Media, messages } = require('markdown-it-html5-media');
messages.en['html5 vide not supported'] = 'Cannot play video.';
````

## Translation

Markdown-It supports passing along environment options, like so:

````javascript
md.render('![some text](video.mp4)', {
  language: 'en'
});
````

This library will look up messages using the  `language` key as in the example provided, or `'en'` if none is provided. Only English messages are included with the library, and the built-in translation function falls back to English if a translation cannot be found.

You can provide additional translations using the approach in the previous example, or you can override the internal translation function, like so:

````javascript
md.use(html5Media, { translateFn: someFunction });
````

Function documentation:

````javascript
/**
 * @param {String} language
 *  a language code, typically an ISO 639-[1-3] code.
 * @param {String} messageKey
 *  an identifier for the message, typically a short descriptive text
 * @param {String[]} messageParams
 *  Strings to be substituted into the message using some pattern, e.g., %s or
 *  %1$s, %2$s. By default we only use a simple %s pattern.
 * @returns {String}
 *  the translation to use
 */
function translateFn(language, messageKey, messageParams) {
  // Your code here
}
````

## Anything else?

The module is written in modern JavaScript. The version in `dist/` is transpiled
down to ES5 compatible with recent browsers. Use `npm run build` to update the
build (does not change contents of `dist`; use `npm run dist` to build & dist).

You can find the automatically generated documentation [here](https://eloquence.github.io/markdown-it-html5-media/HTML5Media.html).
Use `npm run docs` to regenerate it (changes contents of `docs`, which is
tracked).

This library overrides Markdown-It's image tokenizer, which means that it
duplicates portions of that particular Markdown-It code. If you can think of a
better way to do what it does without scanning the whole token stream, please go
ahead and file an issue or send a PR.

Strings should be escaped where they ought to be, but see the provided tests
for yourself. Use at your own risk. :)
