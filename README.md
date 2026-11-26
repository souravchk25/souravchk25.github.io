# souravchk25.github.io

Personal research website of Sourav Chakraborty. It is a Jekyll site that GitHub Pages builds
on every push, so there is no build step to run before pushing.

## Run it on your Mac

### Every time

```sh
cd ~/Desktop/website/souravchk25.github.io
bundle exec jekyll serve --livereload
```

Then open http://localhost:4000. Pages reload when you save a file. Edits to `_config.yml`
need a restart (Ctrl-C, then run the command again). Analytics only run on the live site.

### One-time setup

Already done on the current Mac (Apple Silicon, macOS 14). Repeat it only on a new machine,
or if `ruby -v` stops saying 3.3.

The site needs Ruby 3.x. The Ruby that ships with macOS (`/usr/bin/ruby`, 2.6) is too old.
Don't use `brew install ruby@3.3` either: Homebrew no longer has prebuilt packages for
macOS 14, so it tries to compile Rust and LLVM from source and fails (on `z3`) after a long
wait. Instead, compile only Ruby itself with `ruby-build`. It takes about five minutes.

```sh
# 1. Small libraries Ruby links against, plus the build tool
brew install libyaml openssl@3 readline ruby-build

# 2. Compile Ruby into ~/.rubies (no sudo needed)
RUBY_CONFIGURE_OPTS="--with-openssl-dir=$(brew --prefix openssl@3) --with-libyaml-dir=$(brew --prefix libyaml) --with-readline-dir=$(brew --prefix readline)" \
  ruby-build 3.3.14 ~/.rubies/ruby-3.3.14

# 3. Put it first on PATH (add this line once; check ~/.zshrc for old Ruby lines first)
echo 'export PATH="$HOME/.rubies/ruby-3.3.14/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
ruby -v          # ruby 3.3.14 ...
which ruby       # /Users/<you>/.rubies/ruby-3.3.14/bin/ruby

# 4. Install the site's gems into vendor/bundle inside the repo
gem install bundler
cd ~/Desktop/website/souravchk25.github.io
bundle config set --local path vendor/bundle
bundle install
```

`ruby-build --definitions | grep '^3\.3'` lists the available 3.3 versions if 3.3.14 is
ever gone. Use the newest one and change the version in steps 2 and 3 to match.

`vendor/`, `.bundle/` and `_site/` are in `.gitignore`. They are local only and never pushed.

### If something goes wrong

| Symptom | Cause and fix |
|---|---|
| `ruby -v` says 2.6, or `bundle install` complains about the Ruby version | The new Ruby isn't on PATH. Open a new terminal tab or run `source ~/.zshrc`. Check that `~/.zshrc` has exactly one Ruby PATH line, the `~/.rubies/...` one. |
| `brew install` prints "Tier 3" / "do not provide support" warnings | Expected on macOS 14. They are only warnings; check that the install itself finished. |
| `Invalid US-ASCII character "\xE2"` while building | The terminal isn't using a UTF-8 locale. Add `export LANG=en_US.UTF-8` to `~/.zshrc`. |
| `cannot load such file -- openssl` or `psych` | Ruby was compiled without the libraries. Redo steps 1 and 2 exactly, with `RUBY_CONFIGURE_OPTS` set. |
| `Address already in use` on port 4000 | A previous server is still running. Stop it with Ctrl-C in its tab, or run with `--port 4001`. |
| Gems act strangely after a Ruby upgrade | Delete `vendor/` and run `bundle install` again. |

Harmless noise you can ignore: "To use retry middleware with Faraday v2.0+, install
`faraday-retry` gem", and the `html-pipeline` post-install message during `bundle install`.

## Where things live

| To change | Edit |
|---|---|
| Name, pronunciation, one-liner, photo, the job note | `_data/profile.yml` |
| CV, Scholar, LinkedIn, Email links | `_data/links.yml` |
| The intro paragraphs | `_includes/landing/intro.md` (Markdown) |
| News | `_data/news.yml` (newest first) |
| Random facts | `_data/facts.yml` |
| The landing comic | `_includes/comics/` and `landing.comic` in `_config.yml` |
| Research themes: names, order, colours | `_data/themes.yml` |
| A theme's text, figure, physics note | `_includes/themes/<id>.html` |
| Papers | `_data/papers.yml`, thumbnails in `_includes/thumbs/<id>.html` |
| Map tiles | `_data/sections.yml` |
| Talks, Writing, Projects, Experience, Teaching, Awards, Miscellany | `_includes/panels/<id>.html` |
| Footer | `_includes/footer.html` |
| Colours, fonts, spacing | `assets/css/site.css` (colours are at the top) |
| Map, tabs, figures, facts behaviour | `assets/js/site.js` |
| Switch landing blocks on or off | `landing:` in `_config.yml` |

## Common edits

Add a news item: copy an entry at the top of `_data/news.yml`. `[[Paper title]]` links the
title to its research theme (set `theme:`), `**bold**` shows in the award colour, and
`[text](url)` is a normal link.

Add a paper: copy an entry in `_data/papers.yml`, give it a new `id`, and copy any file in
`_includes/thumbs/` to `<id>.html` for its thumbnail. Papers appear under their `theme`.

New CV: replace `files/cv.pdf`. Every CV link on the site points there. The old
`files/Sourav_Chakraborty_CV_Nov26.pdf` is kept only so links shared earlier still work.

Turn a landing block off: set it to `false` under `landing:` in `_config.yml`.

## Folders

- `_layouts/default.html`: the page shell (head, icons, scripts)
- `_includes/`: page pieces; `_data/`: content lists; `assets/`: CSS and JS
- `files/`: PDFs (CV, papers, thesis); `images/`: photos and figures
- `_src/figures/`: vector sources for figures (not published)
- `_posts/`: blog posts, one Markdown file each, named `YYYY-MM-DD-title.md` (coming later)
