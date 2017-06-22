var demo = new Vue({
  el: '#navitems',
  data: {
    active: 'home'
  },
  methods: {
    makeActive: function(item){
        this.active = item;
    }
  }
})
