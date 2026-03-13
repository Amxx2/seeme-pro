import { Howl } from 'howler';

export type NotificationType = 'coin' | 'transfer' | 'support' | 'analysis' | 'system';

// Audio samples for different notification types
// Using standard synth-like chimes
const sounds: Record<NotificationType, Howl> = {
    coin: new Howl({ src: ['https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3'] }), // Coin sound
    transfer: new Howl({ src: ['https://assets.mixkit.co/active_storage/sfx/2012/2012-preview.mp3'] }), // Cash register
    support: new Howl({ src: ['https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3'] }), // Ping
    analysis: new Howl({ src: ['https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'] }), // Digital scan complete
    system: new Howl({ src: ['https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'] }), // Info beep
};

/**
 * Request permission for browser notifications
 */
export async function requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
        console.warn('This browser does not support desktop notification');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    return false;
}

/**
 * Send a native browser notification
 */
export function sendNativeNotification(title: string, body: string, type: NotificationType = 'system') {
    if (Notification.permission === 'granted') {
        try {
            const n = new Notification(title, {
                body,
                icon: '/seemepro-icon.svg',
            });

            n.onclick = () => {
                window.focus();
                n.close();
            };
        } catch (err) {
            console.error('Error showing notification:', err);
        }
    }

    // Play sound
    sounds[type].play();
}
