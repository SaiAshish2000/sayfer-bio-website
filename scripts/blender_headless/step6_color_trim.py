"""
Step 6: fold the visually-tuned colour balance into the baked vertex colours.

The tuning was done live in the browser as a per-channel multiplier on
material.color; applying the same multiply to final_vc here keeps the GLB
self-describing (material.color goes back to plain white) instead of shipping
an unusual >1 material tint. Pure per-channel scale, so the AO contrast shaped
in step 5 is preserved exactly.

Result is a paler, softer warm gold much closer to the approved R3 render,
which reads as bright ochre walls rather than saturated amber.
"""
import bpy

WORK_PATH = r"D:\Projects\sayfer-bio\assets\blender\sayfer-scaffold-v2-bake-work.blend"
OUT_GLB = r"D:\Projects\sayfer-bio\public\models\sayfer-scaffold-v2.glb"

TINT = (1.13, 1.24, 1.75)  # tuned against artifacts/blender/scaffold-v2-preview-r3.png

bpy.ops.wm.open_mainfile(filepath=WORK_PATH)
lp = bpy.data.objects["Scaffold_LP"]
attr = lp.data.color_attributes["final_vc"]

tr, tg, tb = TINT
peak = 0.0
for i in range(len(attr.data)):
    c = attr.data[i].color
    r, g, b = c[0] * tr, c[1] * tg, c[2] * tb
    peak = max(peak, r, g, b)
    attr.data[i].color = (r, g, b, 1.0)
print(f"peak channel after tint: {peak:.3f} (must stay <= 1.0)")

lp.data.attributes.active_color = attr
lp.data.color_attributes.render_color_index = lp.data.color_attributes.find("final_vc")
bpy.ops.wm.save_as_mainfile(filepath=WORK_PATH)

bpy.ops.object.select_all(action="DESELECT")
lp.select_set(True)
bpy.context.view_layer.objects.active = lp
bpy.ops.export_scene.gltf(
    filepath=OUT_GLB,
    export_format="GLB",
    use_selection=True,
    export_apply=True,
    export_yup=True,
    export_normals=True,
    export_texcoords=False,
    export_tangents=False,
    export_materials="PLACEHOLDER",
    export_vertex_color="ACTIVE",
    export_active_vertex_color_when_no_material=True,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_draco_position_quantization=14,
    export_draco_normal_quantization=10,
    export_draco_color_quantization=10,
)
print("EXPORTED", OUT_GLB)
print("DONE_STEP6")
