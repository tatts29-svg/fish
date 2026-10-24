"""Author: Andrew Fisher. Optional WAV measurements (numpy/scipy), not a listening judgement."""
import hashlib
import json
import pathlib
import sys
import numpy as np
from scipy.io import wavfile
from scipy.signal import welch

def inspect(filename):
    path = pathlib.Path(filename)
    rate, samples = wavfile.read(path)
    samples = samples.astype(float) / 32768
    windows = {}
    for label, start, end in [('staging', .8, 2.4), ('launch', 3.4, 5), ('cruise', 10, 11.5), ('braking', 12.1, 12.8)]:
        audio = samples[round(start * rate):round(end * rate)]
        freq, power = welch(audio, rate, nperseg=8192)
        rms = float(np.sqrt(np.mean(audio * audio)))
        windows[label] = {
            'rms': rms,
            'peak': float(np.max(np.abs(audio))),
            'strongest_bin_fraction': float(power.max() / power.sum()),
            'strongest_bin_hz': float(freq[power.argmax()]),
            'band_power_fraction': {
                f'{low}-{high}Hz': float(power[(freq >= low) & (freq < high)].sum() / power.sum())
                for low, high in [(0, 120), (120, 500), (500, 1500), (1500, 4000), (4000, 20000)]
            }
        }
    return {'wav_sha256': hashlib.sha256(path.read_bytes()).hexdigest(), 'windows': windows}

if __name__ == '__main__':
    result = {'author': 'Andrew Fisher', 'scope': 'Measured source-bound controlled-road offline renders. Staging includes countdown beeps. Harmonic measurements do not certify subjective realism.', 'before': inspect(sys.argv[1]), 'after': inspect(sys.argv[2])}
    pathlib.Path(sys.argv[3]).write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps({name: {window: values['strongest_bin_fraction'] for window, values in result[name]['windows'].items()} for name in ['before', 'after']}))
