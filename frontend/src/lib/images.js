// Real photography (Opal-style) for goals and investing lessons.
export const GOAL_IMAGES = {
  travel: "https://images.unsplash.com/photo-1603477849227-705c424d1d80?crop=entropy&cs=srgb&fm=jpg&q=85&w=800",
  car: "https://images.unsplash.com/photo-1550355291-bbee04a92027?crop=entropy&cs=srgb&fm=jpg&q=85&w=800",
  home: "https://images.unsplash.com/photo-1748063578185-3d68121b11ff?crop=entropy&cs=srgb&fm=jpg&q=85&w=800",
  emergency: "https://images.unsplash.com/photo-1768235743559-3e5c041bac7a?crop=entropy&cs=srgb&fm=jpg&q=85&w=800",
  invest: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?crop=entropy&cs=srgb&fm=jpg&q=85&w=800",
  custom: "https://images.unsplash.com/photo-1579621970795-87facc2f976d?crop=entropy&cs=srgb&fm=jpg&q=85&w=800",
};
export const goalImage = (g) => GOAL_IMAGES[g?.type] || GOAL_IMAGES.custom;

export const LESSON_IMAGES = {
  stocks: "https://images.unsplash.com/photo-1761233138997-44d9b002a08f?crop=entropy&cs=srgb&fm=jpg&q=85&w=400",
  etfs: "https://images.unsplash.com/photo-1601330862030-1e08c703ac04?crop=entropy&cs=srgb&fm=jpg&q=85&w=400",
  index: "https://images.unsplash.com/photo-1641186539288-9c3f26725b12?crop=entropy&cs=srgb&fm=jpg&q=85&w=400",
  bonds: "https://images.unsplash.com/photo-1523292562811-8fa7962a78c8?crop=entropy&cs=srgb&fm=jpg&q=85&w=400",
  retirement: "https://images.unsplash.com/photo-1783253708577-5d657876fb6b?crop=entropy&cs=srgb&fm=jpg&q=85&w=400",
  diversification: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?crop=entropy&cs=srgb&fm=jpg&q=85&w=400",
  risk: "https://images.unsplash.com/photo-1551678050-673ff81c3400?crop=entropy&cs=srgb&fm=jpg&q=85&w=400",
};

export const INVEST_HERO = "https://images.unsplash.com/photo-1651341050677-24dba59ce0fd?crop=entropy&cs=srgb&fm=jpg&q=85&w=1000";
