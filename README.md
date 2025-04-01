# frontpost
a suckless, self-explanatory CMS in 180 lines of code (80ms build time)

```
 _____                _                   _   
|  ___| __ ___  _ __ | |_ _ __   ___  ___| |_ 
| |_ | '__/ _ \| '_ \| __| '_ \ / _ \/ __| __|
|  _|| | | (_) | | | | |_| |_) | (_) \__ \ |_ 
|_|  |_|  \___/|_| |_|\__| .__/ \___/|___/\__|
                         |_|                  
```

### why this and not X?
- support for frontmatter
- theres only 2 dependencies, it's never gonna break
- everything is thoroughly documented, you're meant to continuously update it urself instead of waiting for someone else to update it
- dead simple
- customizable down to everything in templating and file structure
- written in javascript
### why not this?
- pretty barebones
- no integration with frontend frameworks, your templates are html with values parsed in index.js
- written in javascript

## how to use::

you will need a runtime with typescript. i prefer bun
```bash
git clone https://github.com/qwool/frontpost
cd frontpost
bun i
bun prepareDirs
bun ./index.js
```
then, everything is in your dist directory.

## how to ACTUALLY use it::
every X before an option means how much time you'll spend on it. everything is sorted in order of importance. you can do any of them at any time
- ```|___|``` put all your .md files inside src/content
- ```|___|``` any file inside src/static gets copied into dist/
- ```|x__|``` it uses [frontmatter](#frontmatter), which can be [customized](#frontmatter) as well!
- ```|xxx|``` templates are preconfigured, but you can [customize them](#templating)
- ```|xx_|``` also marked.js has functionality which is configured in index.js at line 20
- ```|xxx|``` you can commit anytime! the codebase is in 1 file and it's small enough for anyone with JS knowledge to modify.
### frontmatter
```yaml
---
title: Midwest Emo and why Nick Hartkop should be put down.
description: idk? just my thoughts tbh
(BUT if you disagree you're wrong!!)
created: 2000-10-01 12:58:45
customValue: anything
---
```
if you've used any actual markdown CMS you know this - just put a similar block at the start and you're set!  
also you can add any of them to ur template!! just use ```{fm value}``` where value is a string. maybe u wanna add an author? idk u do u man
again, every default thing in the order of importance:
- ```created: (any time JS will understand(so basically anything))``` - it's needed for sorting your posts
- ```title: string``` - very much useless if you have a heading first thing in your document, but just in case it's there. not required
- ```description``` - actually add it bc otherwise it takes the first paragraph which sucks ass!!!!!
### templating
everything is contained in files in src/templates

default strings are as follows:

```articleListing.html```
- created
- url
- description
- title

```post.html```
- content
- title
- header
- created

```index.html```
- articles
- header

### beyond//contacts::
contact me anywhere from discord qwool#5851/@fuckcars to telegram @qwool if you decide you wanna contribute anything to this project
and need some help decyphering/understanding any part of it.

## to install dependencies::
```bash
npm install
```
3 external dependecies - marked.js, js-yaml and strftime.

## to run::

```bash
node index.js
```
## thanks to!
- [marked.js](https://github.com/markedjs/marked) contributors
- whoever fixes lines 56-88

