/* global it, describe */
'use strict';
const assert = require('assert');
const MarkdownIt = require('markdown-it');
const { html5Media } = require('../lib/index.js');
const path = require('path');
const generate = require('markdown-it-testgen');

const md = new MarkdownIt();
md.use(html5Media);

describe('Parser tests', function() {
  describe('Tokenize image', function() {
    it('.jpg URL should return a token of the type image w/ correct attributes', function() {
      const tokens = md.parse('![alt text](image.jpg "title text")');
      // Result is wrapped in paragraph
      const token = tokens[1].children[0];
      assert.equal('image', token.type);
      assert.equal('image.jpg', token.attrs[0][1]);
      assert.equal('title text', token.attrs[2][1]);
      assert.equal('alt text', token.content);
    });
    it('.unknown URL should default to image tokenization', function() {
      const tokens = md.parse('![alt text](image.unknown)');
      const token = tokens[1].children[0];
      assert.equal('image', token.type);
      assert.equal('image.unknown', token.attrs[0][1]);
      assert.equal('alt text', token.content);
    });
  });
  describe('Tokenize other media', function() {
    it('.mp3 URL should return a token of the type audio w/ correct attributes', function() {
      const tokens = md.parse('![descriptive text](audio.mp3 "title text")');
      const token = tokens[1].children[0];
      assert.equal('audio', token.type);
      assert.equal('audio.mp3', token.attrs[0][1]);
      assert.equal('title text', token.attrs[1][1]);
      assert.equal('descriptive text', token.content);
    });
    it('.mp4 URL should return a token of the type video', function() {
      const tokens = md.parse('![descriptive text](video.mp4)');
      const token = tokens[1].children[0];
      assert.equal('video', token.type);
      assert.equal('video.mp4', token.attrs[0][1]);
      assert.equal('descriptive text', token.content);
    });
  });
});

describe('Renderer tests', function() {
  describe('Render images (not modified by module)', function() {
    generate(path.join(__dirname, 'fixtures/render-images.txt'), { header: true }, md);
  });
  describe('Render media', function() {
    generate(path.join(__dirname, 'fixtures/render-media.txt'), { header: true }, md);
  });
  describe('Render media with customized attributes', function() {
    const newMd = new MarkdownIt();
    newMd.use(html5Media, {
      videoAttrs: 'class="custom-css"',
      audioAttrs: ''
    });
    generate(path.join(__dirname, 'fixtures/render-media-custom-attributes.txt'), { header: true }, newMd);
  });
  describe('Render media with customized messages passed as option', function() {
    const newMd = new MarkdownIt();
    // Prevent re-using altered messages across instances
    Reflect.deleteProperty(require.cache, require.resolve('../lib/index'));
    const newHtml5Media = require('../lib/index').html5Media;
    const messages = {
      en: {
        'html5 video not supported': 'Cannot play video.',
        'html5 audio not supported': 'Cannot play audio.',
        'html5 media fallback link': '"%s" was the filename',
        'html5 media description': '"%s" was the description'
      }
    };
    newMd.use(newHtml5Media, {
      messages
    });
    generate(path.join(__dirname, 'fixtures/render-media-custom-messages.txt'), { header: true }, newMd);
  });
  describe('Render media with partially customized messages', function() {
    const newMd = new MarkdownIt();
    // Prevent re-using altered messages across instances
    Reflect.deleteProperty(require.cache, require.resolve('../lib/index'));
    const newHtml5Media = require('../lib/index').html5Media;
    const messages = require('../lib/index').messages;
    messages.en['html5 video not supported'] = 'CANNOT PLAY VIDEO.';
    newMd.use(newHtml5Media, {
      messages
    });
    generate(path.join(__dirname, 'fixtures/render-media-partial-custom-messages.txt'), { header: true }, newMd);
  });

  describe('Render media with customized translation function', function() {
    const newMd = new MarkdownIt();
    // Prevent re-using altered translate function across instances
    Reflect.deleteProperty(require.cache, require.resolve('../lib/index'));
    const newHtml5Media = require('../lib/index').html5Media;
    const translateFn = (language, messageKey, messageParams) => {
      const p = messageParams ? ` with parameter(s) ${messageParams}` : '';
      return `No translation for ${messageKey}${p}`;
    };
    newMd.use(newHtml5Media, {
      translateFn
    });
    generate(path.join(__dirname, 'fixtures/render-media-translatefn.txt'), { header: true }, newMd);
  });

});
