import bpy, os, math, sys
# 9 hosts from sumerian-squares teardown
HOSTS = [
    ("cristine", "#e0a24a", "Uruk (Warka)"),
    ("fiona", "#2f8fb0", "Ur, Sumer"),
    ("grace", "#3fae6f", "Sumer"),
    ("maya", "#b060c0", "marshes"),
    ("alien", "#2fc8c8", "cosmic (pre-Sumer)"),
    ("luke", "#4a6ec0", "Sumer"),
    ("jay", "#d4a020", "Sumer"),
    ("preston", "#9a5ad0", "Sumer"),
    ("wes", "#6fae40", "reed-marsh"),
]
VIEWS = [
    "front_neutral",
    "front_smile",
    "front_frown",
    "front_brow_raise",
    "front_surprise",
    "back_neutral",
    "left_3q_neutral",
    "right_3q_neutral",
]
# camera positions per view (location, rotation_euler)
CAM = {
    "front_neutral":       ((0, -6, 1.2), (math.radians(90), 0, 0)),
    "front_smile":         ((0, -6, 1.3), (math.radians(90), 0, 0)),
    "front_frown":         ((0, -6, 1.1), (math.radians(90), 0, 0)),
    "front_brow_raise":    ((0, -6, 1.4), (math.radians(90), 0, 0)),
    "front_surprise":      ((0, -6, 1.25),(math.radians(90), 0, 0)),
    "back_neutral":        ((0, 6, 1.2), (math.radians(90), 0, math.radians(180))),
    "left_3q_neutral":     ((-4.2, -4.2, 1.5), (math.radians(88), 0, math.radians(-45))),
    "right_3q_neutral":    ((4.2, -4.2, 1.5), (math.radians(88), 0, math.radians(45))),
}

proj_home = "/home/bryanchasko/blender-projects"
proj_tmp = "/tmp/adobe-express-mcp-lab"
for base in [proj_home, proj_tmp]:
    for h,_accent,_town in HOSTS:
        for v in VIEWS:
            d = os.path.join(base, "renders", "contact-sheet", h)
            os.makedirs(d, exist_ok=True)

scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE_NEXT'
scene.render.resolution_x = 1024
scene.render.resolution_y = 1024
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.render.film_transparent = True

cam_obj = bpy.data.objects.get("OrthoCamera")
if cam_obj is None:
    # create camera if missing
    cam_data = bpy.data.cameras.new("OrthoCamera")
    cam_obj = bpy.data.objects.new("OrthoCamera", cam_data)
    bpy.context.collection.objects.link(cam_obj)
    scene.camera = cam_obj
else:
    scene.camera = cam_obj

# Ensure EEVEE settings reasonable for headless
if hasattr(scene, "eevee"):
    try:
        scene.eevee.taa_render_samples = 16
    except: pass

arm = bpy.data.objects.get("LatrodectusArmature")
# Host accent mapping: we will tint the Abdomen material per host if possible
def set_host_accent(hex_color):
    try:
        # naive: set world background or material
        # try to set Abdomen material diffuse
        mesh = bpy.data.objects.get("Abdomen")
        if mesh and mesh.data.materials and len(mesh.data.materials)>0:
            mat = mesh.data.materials[0]
            if mat and mat.use_nodes:
                # find Principled BSDF and set base color
                for n in mat.node_tree.nodes:
                    if n.type=='BSDF_PRINCIPLED':
                        # hex to rgb
                        h=hex_color.lstrip('#')
                        r=int(h[0:2],16)/255.0
                        g=int(h[2:4],16)/255.0
                        b=int(h[4:6],16)/255.0
                        n.inputs['Base Color'].default_value = (r,g,b,1)
                        break
    except Exception as e:
        print(f"accent tint failed {e}")

# Expression handling: slightly rotate brow/finger bones per view expression
expr_bone_offsets = {
    "front_neutral": {},
    "front_smile": {"L_Index_MCP": 0.1, "R_Index_MCP": 0.1},
    "front_frown": {"L_Index_MCP": -0.1, "R_Index_MCP": -0.1},
    "front_brow_raise": {"L_Wrist": 0.15, "R_Wrist": 0.15},
    "front_surprise": {"L_Thumb_MCP": 0.2, "R_Thumb_MCP": 0.2},
    "back_neutral": {},
    "left_3q_neutral": {},
    "right_3q_neutral": {},
}

orig_rotations = {}
if arm and arm.pose:
    for b in arm.pose.bones:
        orig_rotations[b.name] = b.rotation_euler.copy() if b.rotation_mode=='XYZ' else None

count=0
for host, accent, hometown in HOSTS:
    set_host_accent(accent)
    for view in VIEWS:
        loc, rot = CAM[view]
        cam_obj.location = loc
        cam_obj.rotation_euler = rot
        # apply expression offsets if any
        if arm and arm.pose:
            # reset first
            for bname, orig in orig_rotations.items():
                if orig is not None:
                    arm.pose.bones[bname].rotation_euler = orig
            offsets = expr_bone_offsets.get(view, {})
            for bname, delta in offsets.items():
                if bname in arm.pose.bones:
                    pb = arm.pose.bones[bname]
                    if pb.rotation_mode!='XYZ':
                        pb.rotation_mode='XYZ'
                    pb.rotation_euler.x += delta
            bpy.context.view_layer.update()
        for base in [proj_home, proj_tmp]:
            out = os.path.join(base, "renders", "contact-sheet", host, f"{view}.png")
            scene.render.filepath = out
            bpy.ops.render.render(write_still=True)
            count+=1
            print(f"rendered {out}")

print(f"CONTACT SHEET COMPLETE: {count} PNGs (expected 144 across both bases, 72 per base) 8 views x 9 hosts")
