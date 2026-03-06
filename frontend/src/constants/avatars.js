import avatar1 from '../assets/avatars/avatar1.png';
import avatar2 from '../assets/avatars/avatar2.png';
import avatar3 from '../assets/avatars/avatar3.png';
import avatar4 from '../assets/avatars/avatar4.png';
import avatar5 from '../assets/avatars/avatar5.png';

export const PRESET_AVATARS = [
  { id: 'avatar1', img: avatar1, path: '/avatars/avatar1.png' },
  { id: 'avatar2', img: avatar2, path: '/avatars/avatar2.png' },
  { id: 'avatar3', img: avatar3, path: '/avatars/avatar3.png' },
  { id: 'avatar4', img: avatar4, path: '/avatars/avatar4.png' },
  { id: 'avatar5', img: avatar5, path: '/avatars/avatar5.png' },
];

export const getAvatarImage = (avatarIdOrPath) => {
  if (!avatarIdOrPath) return PRESET_AVATARS[0].img;

  // Try ID match
  const foundById = PRESET_AVATARS.find(a => a.id === avatarIdOrPath);
  if (foundById) return foundById.img;

  // Try path match (fallback for existing DB records)
  const foundByPath = PRESET_AVATARS.find(a =>
    a.path === avatarIdOrPath ||
    avatarIdOrPath.includes(a.id)
  );
  if (foundByPath) return foundByPath.img;

  // If it's an external URL, return as is
  if (avatarIdOrPath.startsWith('http') || avatarIdOrPath.startsWith('https') || avatarIdOrPath.startsWith('data:')) {
    return avatarIdOrPath;
  }

  // Default fallback
  return PRESET_AVATARS[0].img;
};
