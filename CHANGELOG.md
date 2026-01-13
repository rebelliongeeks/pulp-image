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
- Updated project slogan

---

## [0.1.7] - 2026-01-12

### Added
- Auto suffix option to add dimensions to filenames
- Custom suffix support for output filenames
- Rename patterns with tokens {name}, {ext}, {index} (UI only)

### Fixed
- Minor bug fixes and improvements

---

## [0.1.0] - Initial Release

### Added
- **CLI Tool**: Full command-line interface for image processing
- **Browser UI**: Launch with `pulp ui`, works offline, no uploads
- **Format Conversion**: PNG, JPG, WebP, AVIF, GIF, TIFF
- **Resize**: By width, height, or exact dimensions
- **Quality Control**: Compression quality 1-100
- **Lossless Mode**: For WebP and AVIF
- **Transparency Handling**: Flatten with custom background color
- **Batch Processing**: Process entire folders
- **Custom Output Directory**: Save files anywhere
- **Overwrite Protection**: Skip or overwrite existing files
- **Delete Originals**: Remove source files after processing (CLI only)

---

*For upcoming features, see the [Roadmap](ROADMAP.md).*
