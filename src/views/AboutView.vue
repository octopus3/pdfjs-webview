<template>
  <div class="about">
    <div class="text-1">This is an about page</div>
    <div class="text-container">
      <div class="text-2">This is an about page</div>
    </div>
    
  </div>
</template>


<style lang="scss">
.about {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  .text-1 {
    font-size: 24px;
    text-decoration: underline dashed #A1C0DA;
  }
  .text-container {
    width: 300px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    box-sizing: border-box;
    .text-2 {
      font-size: 24px;
      margin-top: 24px;
      border-bottom: 1px dashed #A1C0DA;
    
    }
  }
  
}
</style>