const blogImages = document.querySelectorAll(
  ".post-media img, .post-media-grid img, .post-wide-media img",
);

if (blogImages.length) {
  const viewer = document.createElement("div");
  viewer.className = "image-viewer";
  viewer.setAttribute("role", "dialog");
  viewer.setAttribute("aria-modal", "true");
  viewer.setAttribute("aria-label", "Expanded blog image");
  viewer.innerHTML = `
    <button type="button" aria-label="Close expanded image">&times;</button>
    <img alt="" />
  `;

  document.body.appendChild(viewer);

  const viewerImage = viewer.querySelector("img");
  const closeButton = viewer.querySelector("button");

  const closeViewer = () => {
    viewer.classList.remove("is-open");
    viewerImage.removeAttribute("src");
    viewerImage.alt = "";
  };

  blogImages.forEach((image) => {
    image.tabIndex = 0;
    image.setAttribute("role", "button");
    image.setAttribute("aria-label", `View larger image: ${image.alt}`);

    const openViewer = () => {
      viewerImage.src = image.currentSrc || image.src;
      viewerImage.alt = image.alt;
      viewer.classList.add("is-open");
      closeButton.focus();
    };

    image.addEventListener("click", openViewer);
    image.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openViewer();
      }
    });
  });

  closeButton.addEventListener("click", closeViewer);
  viewer.addEventListener("click", (event) => {
    if (event.target === viewer) {
      closeViewer();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && viewer.classList.contains("is-open")) {
      closeViewer();
    }
  });
}
