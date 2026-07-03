<template>
  <div class="page-container">
    <iframe frameborder="0" />
  </div>
</template>
<style lang="scss" scoped>
@use "@/styles/base/variables" as *;

.page-container {
  height: calc(100vh - $navbar-height);
}

.hasTagsView {
  .page-container {
    height: calc(100vh - $navbar-height - $tags-view-height);
  }
}

iframe {
  width: 100%;
  height: 100%;
}
</style>
