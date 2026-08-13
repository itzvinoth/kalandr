FROM rust:slim-bookworm

RUN apt-get update && apt-get install -y --no-install-recommends \
      build-essential \
      pkg-config \
      libwebkit2gtk-4.1-dev \
      libgtk-3-dev \
      libayatana-appindicator3-dev \
      librsvg2-dev \
      file \
    && rm -rf /var/lib/apt/lists/*

RUN cargo install tauri-cli --version "^2" --locked

WORKDIR /app
