"""Author: Andrew Fisher. Reviewed v5.94 server inventory protection, retained unchanged from v12.85."""
from machine1302 import HEX

# Public v5.89 deployment handover: PR #1 comment 6241517868 and STATUS.md.
# Inventory proves presence/size, not the running process's environment protection.
# These exact allowlisted blobs rely on that reviewed SERVER_FILE/KEEP handover.
SERVER_BUILD = 'v5.94'
# Current running server and all predecessors protected by server_v5.94_switch/README.md.
# Source bytes independently hashed against this repository; no keep-list is altered here.
SERVER_BLOBS = {
    '55a19453304406e9fcf0891ae6151e8516357e83e22987fc334e2bf9428ad0ec': 289090,
    'c1b8bf9c999d4e548384b682592409507dbaf8bb7c4c62c590b62127b69c89b7': 292090,
    'bdb058ffe1d7e269be978546581383a85f11bd7fc7078f569d41de33b6efe396': 292810,
    '8764451d3768fcfbfc493da48fb9901503dcd6af0f8df247478aa53fb9428f46': 294310,
    '9857a9786c875e6f2ffe75bc0f09e0c05500712188222fcb86b9fccc4a6d4b98': 307975,
    '264363128b6c4bc1fd86b2fd6712400dd4c367b45a6ca195b7fb2ee1c8f21a14': 216494,
    '76afbd997a9fcfd6e796eea4ead641a5249a1bad23114417c861fd1559057684': 228182,
    'b8d38b8f889baeffce25401a285f25286bbb4a6ae67f2c0f6e8a81eb214991dd': 186734,
    'cb32d00e0d4beb90870685978981b1e14541a701c7b37cb1f180d848c134019c': 283062,
    'd5a0d777da4871af1bf88804b4ef223354a29c2560213ab56f7897445b398fdc': 237432,
    'f5b9a3f7efdf880b5f10d0ee339761d35adf9b9ff5bdd3a528505215be6b6fe9': 236308,
}
MACHINE_TOOL_SHA256 = '920fbad67167526dc9118d007c394d050f579bd97d18a8251ee8ea3994c03d73'


def validate_server(health):
    if (health.get('ok') is not True or health.get('build') != SERVER_BUILD
            or health.get('record_recovered') is not None or health.get('tracker_refusing') is not None):
        raise ValueError('Server readiness differs from the reviewed v5.94 protection handover')
    return SERVER_BUILD


def inventory_map(body):
    if not isinstance(body, dict) or not isinstance(body.get('blobs'), list):
        raise ValueError('Invalid full machine inventory')
    result = {}
    for item in body['blobs']:
        key, size = item.get('sha256'), item.get('bytes')
        if (not isinstance(key, str) or not HEX.fullmatch(key) or key in result
                or type(size) is not int or size <= 0):
            raise ValueError('Invalid or duplicate inventory descriptor')
        result[key] = size
    return result

