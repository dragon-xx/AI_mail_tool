// crypto-polyfill.js
import { randomBytes } from 'crypto';

// 为Node.js环境提供crypto.getRandomValues的polyfill
if (typeof globalThis.crypto === 'undefined') {
  globalThis.crypto = {};
}

// 确保getRandomValues方法存在且可用
try {
  // 测试getRandomValues是否可用
  if (typeof globalThis.crypto.getRandomValues === 'undefined' || 
      !(globalThis.crypto.getRandomValues instanceof Function)) {
    throw new Error('crypto.getRandomValues is not available');
  }
  // 测试getRandomValues是否正常工作
  const testArray = new Uint8Array(8);
  globalThis.crypto.getRandomValues(testArray);
} catch (e) {
  console.log('应用crypto.getRandomValues polyfill:', e.message);
  // 重新定义getRandomValues方法
  globalThis.crypto.getRandomValues = function(array) {
    const bytes = randomBytes(array.length);
    
    // 确保正确地将随机字节复制到目标数组
    if (array instanceof Uint8Array) {
      for (let i = 0; i < bytes.length; i++) {
        array[i] = bytes[i];
      }
    } else {
      // 处理其他类型的TypedArray
      const tempArray = new Uint8Array(bytes);
      for (let i = 0; i < array.length; i++) {
        array[i] = tempArray[i % tempArray.length];
      }
    }
    
    return array;
  };
}

export default function setupCryptoPolyfill() {
  // 这个函数只是为了确保polyfill被正确导入
  console.log('Crypto polyfill has been set up');
  return true;
}