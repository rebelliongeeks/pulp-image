# Changelog

All notable changes to Pulp Image will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

See [Roadmap](ROADMAP.md) for upcoming features (v0.2.0: UI Redesign, Rotate, Flip, Grayscale, Auto-Orient).

---

## [0.1.8] - 2026-01-13

### Changed
- Streamlined README with quick links and features grid
- Added public roadmap and changelog
- Improved documentation and help content

---

## [0.1.7] - 2026-01-12

### Fixed
- Custom output directory filter not working correctly in UI

### Changed
- Improved Help tab content and styling

---

## [0.1.6] - 2026-01-11

### Changed
- Updated README and package.json homepage

---

## [0.1.5] - 2026-01-11

### Fixed
- UI color contrast for WCAG AA accessibility

---

## [0.1.4] - 2026-01-10

### Fixed
- Terminal banner (ASCII art) width now dynamic

---

## [0.1.3] - 2026-01-10

### Fixed
- Dynamic version display in banner

---

## [0.1.2] - 2026-01-09

### Fixed
- npm bin configuration for global install

---

## [0.1.1] - 2026-01-09 (Initial Release)

### Added
- **CLI Tool**: Full command-line interface for image processing
- **Browser UI**: Launch with `pulp ui`, works offline, no uploads
- **Format Conversion**: PNG, JPG, WebP, AVIF
- **Resize**: By width, height, or exact dimensions with aspect ratio preservation
- **Quality Control**: Compression quality 1-100 for lossy formats
- **Lossless Mode**: For WebP and AVIF
- **Transparency Handling**: Flatten with custom background color
- **Batch Processing**: Process entire folders at once
- **Auto Suffix**: Add dimensions to filenames (-800w, -600h, -800x600)
- **Custom Suffix**: Add custom text to output filenames
- **Rename Patterns**: Tokens {name}, {ext}, {index} for output naming (UI only)
- **Custom Output Directory**: Save files anywhere
- **Overwrite Protection**: Skip or overwrite existing files
- **Delete Originals**: Remove source files after processing (CLI only)
- **Verbose Mode**: Detailed per-file output (CLI only)
- **Statistics**: Original size, final size, bytes saved, percentage reduction

---

*For upcoming features, see the [Roadmap](ROADMAP.md).*
