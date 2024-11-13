<template>
  <section class="overaly">
    <img class="left" src="../assets/images/overaly/left.png" alt="">
    <img class="right" src="../assets/images/overaly/right.png" alt="">
  </section>
</template>

<script setup>
import { reactive, toRefs, onBeforeMount, onMounted, watchEffect } from 'vue';
const data = reactive({})
onBeforeMount(() => {
})
onMounted(() => {
})
watchEffect(()=>{
})
defineExpose({
  ...toRefs(data)
})

</script>
<style scoped lang='scss'>
  .left{
        z-index: 5;
        position: absolute;
        top: 0;
        left: 0;
        // margin-top: 1rem;
        width: 8rem;
        height: 100%;
    }
    .right{
        z-index: 5;
        position: absolute;
        top: 0;
        right: 0;
        // margin-top: 1rem;
        width: 8rem;
        height: 100%;
    }
</style>