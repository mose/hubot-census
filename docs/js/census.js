new Vue({
  el: '#vue',
  data: {
    active: 'home'
  },
  methods: {
    makeActive: function(item){
        this.active = item;
    }
  }
})
