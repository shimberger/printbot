Dropzone.options.dropzone = {
  previewsContainer: '#fakepreview',
  accept: function(file, done) {
    var suffix = ".pdf";
    if (file.name.slice(-suffix.length) == suffix) {
      done();
    }
    return false;
  },
  init: function() {
    this.on('sending',function() {
      alert('sending');
    });
    this.on('complete',function() {
      $()
    });
  }
}
