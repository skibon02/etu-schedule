 function routingFx(navigate, loc, vkData) {
  if (loc === '/' && vkData && vkData.is_authorized) {
    navigate('/schedule');
    return;
  }
  if (vkData  && !vkData.is_authorized) {
    navigate('/profile');
    return;
  }
  if (loc !== '/planning' && loc !== '/profile' && loc !== '/schedule') {
    navigate('/schedule');
    return;
  }
}

export {
  routingFx,
}
