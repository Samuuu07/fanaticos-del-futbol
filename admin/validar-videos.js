CMS.registerEventListener({
  name: "preSave",
  handler: ({ entry }) => {
    if (entry.get("collection") !== "videos") return;
    const videos = entry.getIn(["data", "videos"]);
    videos?.forEach(item => {
      const video = item.toJS();
      if (video.archivo && video.url?.trim()) {
        throw new Error(`«${video.titulo}» tiene archivo y enlace. Quita uno de los dos antes de guardar.`);
      }
      resolverOrigen(video);
    });
  }
});
