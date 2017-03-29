# annotator

Got an image you want to point details out on? **annotator** creates embeddable HTML to help users dive in to details on a document. [Here's an example](https://www.buzzfeed.com/kenbensinger/how-donald-trumps-enemies-fell-for-a-billion-dollar-hoax).

It consists of a builder and an engine. The builder creates embeds, the engine renders embeds on to the page.

![Screenshot](https://games.buzzfeed.com/_uk/annotator/img/screenshot.jpg)

## get started in 30 seconds

### I wish to annotate an image and generate an embed

The builder is located at `./builder/index.html`.

Please note: You will need to host `dist/annotator.min.js` yourself before putting an embed live. Read on for how to do that...

### I wish to get annotator working for our organisation

Get the latest version of yarn (0.21+): [https://yarnpkg.com/en/](https://yarnpkg.com/en/)

Then just run `yarn` in the repository folder.

This will grab the packages it needs, then use grunt to build the distributable engine. Once that's done, it'll watch for changes in `js/` and `sass/`, rebuilding when it sees them.

The two main files to modify are `js/annotator.js` and `sass/annotator.scss`. It will build to the single file `dist/annotator.min.js`, which you can then upload to your own infrastructure.

We would recommend at minimum changing the following to your requirements:

* `builder/builder-config.js` to point to your distributable
* `sass/annotator.sass` to meet your own styling requirements
* We use the `<!-- UKNF -->` tag to mark our embeds as special in the BuzzFeed CMS. You probably won't need this tag, so feel free to remove it.

Be aware: **annotator** will add the following to the global scope of your page.

* Styling which is applied to page objects with a parent class of `.annotated_media`
* window.annotate_media and window.annotate_tools are new JS globals which may be called

**annotator** is powered primarily by a cut-down version of jQuery.