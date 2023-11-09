import path from 'path';
import gateway from 'express-gateway';
// const expGateway = gateway()
const gateWayServer = (homePath)=>
{
  const cacheConfig = {
    type: 'memory',
    size: 1000,
    ttl: 600,
    keys: ['/users', '/products'],
  };
  // expGateway.route('/products').cache(cacheConfig)
  const loc = path.join(homePath,'gateway', 'config')
  console.log('location',loc)
  return gateway()
  .load(loc)
  .run();
  
}

export default gateWayServer
